#!/bin/bash
# Industrial USB Auto-Mount Helper for Lenovo ThinkCentre (AMD64)
LOG=/tmp/usb-mount.log
echo "--- USB Mount attempt at $(date) ---" > "$LOG"

mkdir -p /media/usb
chmod 777 /media/usb 2>/dev/null || true

# 1. Check if already mounted
if grep -qs '/media/usb ' /proc/mounts; then
  echo "ALREADY_MOUNTED" >> "$LOG"
  echo "SUCCESS"
  exit 0
fi

# 2. Find external block devices (ignoring already mounted root/boot partitions)
ROOT_DEV=$(findmnt -n -o SOURCE / | sed 's/p[0-9]*$//; s/[0-9]*$//')
echo "Detected OS Root Drive: $ROOT_DEV" >> "$LOG"

CANDIDATES=""
# Check all /dev/sd* and /dev/nvme* devices
for dev in /dev/sd[a-z][1-9] /dev/sd[a-z] /dev/nvme[1-9]n[1-9]p[1-9]; do
  if [ -b "$dev" ]; then
    # Skip if device is already mounted anywhere (like / or /boot)
    if grep -qs "^$dev " /proc/mounts; then
      continue
    fi
    # Skip if belongs to root drive
    if [[ "$dev" == "$ROOT_DEV"* ]] && grep -qs "$dev" /proc/mounts; then
      continue
    fi
    CANDIDATES="$CANDIDATES $dev"
  fi
done

echo "Found candidate USB devices: $CANDIDATES" >> "$LOG"

if [ -z "$CANDIDATES" ]; then
  echo "ERROR: No USB Flash Drive detected."
  exit 1
fi

MOUNTED=0
for dev in $CANDIDATES; do
  FSTYPE=$(blkid -s TYPE -o value "$dev" 2>/dev/null)
  echo "Trying $dev (type: $FSTYPE)" >> "$LOG"

  if [ "$FSTYPE" = "vfat" ] || [ "$FSTYPE" = "fat" ]; then
    mount -t vfat -o rw,umask=000,utf8 "$dev" /media/usb >> "$LOG" 2>&1 && MOUNTED=1
  elif [ "$FSTYPE" = "ntfs" ]; then
    mount -t ntfs-3g -o force,rw,umask=000 "$dev" /media/usb >> "$LOG" 2>&1 && MOUNTED=1
  elif [ "$FSTYPE" = "exfat" ]; then
    mount.exfat-fuse -o umask=000 "$dev" /media/usb >> "$LOG" 2>&1 && MOUNTED=1 ||     mount -t exfat -o rw,umask=000 "$dev" /media/usb >> "$LOG" 2>&1 && MOUNTED=1
  else
    # Fallbacks
    mount -o rw,umask=000 "$dev" /media/usb >> "$LOG" 2>&1 && MOUNTED=1 ||     mount -t vfat -o rw,umask=000 "$dev" /media/usb >> "$LOG" 2>&1 && MOUNTED=1 ||     mount -t ntfs-3g -o force,rw "$dev" /media/usb >> "$LOG" 2>&1 && MOUNTED=1 ||     mount "$dev" /media/usb >> "$LOG" 2>&1 && MOUNTED=1
  fi

  if grep -qs '/media/usb ' /proc/mounts; then
    MOUNTED=1
    break
  fi
done

if grep -qs '/media/usb ' /proc/mounts; then
  echo "SUCCESS: Mounted to /media/usb" >> "$LOG"
  echo "SUCCESS"
  exit 0
else
  echo "ERROR: Failed to mount USB flash drive." >> "$LOG"
  exit 1
fi
