#!/bin/bash
# Sync and safely unmount USB Flash Drive on Siemens IOT2050
sync
umount /media/usb 2>/dev/null || umount -l /media/usb 2>/dev/null || true
echo "UNMOUNTED"
