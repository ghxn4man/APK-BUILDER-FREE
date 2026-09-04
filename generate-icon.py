#!/usr/bin/env python3
# Optional icon helper. Pillow is used only in the GitHub runner.
from PIL import Image, ImageOps
import sys
src,dst,scale,pad=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])
im=Image.open(src).convert("RGBA"); n=1024
canvas=Image.new("RGBA",(n,n),(0,0,0,0))
side=int(n*(scale/100)); im.thumbnail((side,side),Image.Resampling.LANCZOS)
x=(n-im.width)//2;y=(n-im.height)//2;canvas.alpha_composite(im,(x,y));canvas.save(dst)
