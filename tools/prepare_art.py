#!/usr/bin/env python3
"""Prepare Serena's artwork for the gallery (art.html).

    python3 tools/prepare_art.py <image> <id> [<image> <id> ...]

For each image this makes two JPEGs in assets/art/:

    <id>.jpg       the picture on the wall, 1000px on its long side
    <id>-full.jpg  the full-screen one, up to 2000px on its long side
                   (never enlarged)

and strips every bit of metadata from both (camera data, GPS location,
XMP, Photoshop/IPTC blocks, comments), keeping only the colour profile.
Then it prints a line per piece with its pixel size, for art-data.js.

It uses `sips`, which comes with macOS, and nothing outside the Python
standard library. Run it from the repo root.
"""
import os
import struct
import subprocess
import sys
import tempfile

OUT = os.path.join("assets", "art")
WALL = (1000, 80)     # long side, JPEG quality
FULL = (2000, 86)


def size(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path],
                         check=True, capture_output=True, text=True).stdout
    vals = dict(line.split(":") for line in out.splitlines()[1:] if ":" in line)
    return int(vals["  pixelWidth"].strip()), int(vals["  pixelHeight"].strip())


def strip_jpeg(path):
    """Drop every APPn segment except APP0 (JFIF) and APP2 (ICC colour
    profile), and any COM segments. APP1 is where EXIF, GPS and XMP live."""
    data = open(path, "rb").read()
    if data[:2] != b"\xff\xd8":
        raise ValueError(path + " isn't a JPEG")
    out, pos = [data[:2]], 2
    while pos < len(data):
        if data[pos] != 0xFF:
            raise ValueError("bad marker in " + path)
        marker = data[pos + 1]
        if marker == 0xDA:                      # start of scan: the rest is image data
            out.append(data[pos:])
            break
        length = struct.unpack(">H", data[pos + 2:pos + 4])[0]
        seg = data[pos:pos + 2 + length]
        keep = not ((0xE0 <= marker <= 0xEF and marker not in (0xE0, 0xE2)) or marker == 0xFE)
        if keep:
            out.append(seg)
        pos += 2 + length
    open(path, "wb").write(b"".join(out))


def check_clean(path):
    """Only the header is checked: the compressed picture after it can
    contain any bytes at all, "GPS" included."""
    data = open(path, "rb").read()
    pos = 2
    while pos < len(data) and data[pos + 1] != 0xDA:
        marker = data[pos + 1]
        length = struct.unpack(">H", data[pos + 2:pos + 4])[0]
        if (0xE0 <= marker <= 0xEF and marker not in (0xE0, 0xE2)) or marker == 0xFE:
            raise ValueError("%s still has metadata (segment %02X)" % (path, marker))
        pos += 2 + length


def make(src, dest, longest, quality):
    w, h = size(src)
    cmd = ["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(quality)]
    if max(w, h) > longest:
        cmd += ["-Z", str(longest)]
    with tempfile.TemporaryDirectory() as tmp:
        tmp_out = os.path.join(tmp, "out.jpg")
        subprocess.run(cmd + [src, "--out", tmp_out], check=True, capture_output=True)
        strip_jpeg(tmp_out)
        check_clean(tmp_out)
        os.replace(tmp_out, dest)
    return size(dest)


def main(args):
    if len(args) < 2 or len(args) % 2:
        sys.exit(__doc__)
    os.makedirs(OUT, exist_ok=True)
    for src, pid in zip(args[0::2], args[1::2]):
        wall = make(src, os.path.join(OUT, pid + ".jpg"), *WALL)
        full = make(src, os.path.join(OUT, pid + "-full.jpg"), *FULL)
        kb = (os.path.getsize(os.path.join(OUT, pid + ".jpg")) // 1024,
              os.path.getsize(os.path.join(OUT, pid + "-full.jpg")) // 1024)
        print("%-22s wall %4dx%-4d %4d KB   full %4dx%-4d %4d KB" % (pid, wall[0], wall[1], kb[0], full[0], full[1], kb[1]))


if __name__ == "__main__":
    main(sys.argv[1:])
