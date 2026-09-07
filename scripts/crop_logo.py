from PIL import Image

source = "/home/ubuntu/visual-guide-work/assets/images/visual-guide-logo.webp"
output = "/home/ubuntu/visual-guide-work/assets/images/visual-guide-mark.png"
image = Image.open(source).convert("RGBA")
# The supplied banner places the emblem in the central upper area.
crop = image.crop((720, 170, 1320, 760))
side = max(crop.size)
canvas = Image.new("RGBA", (side, side), (255, 255, 255, 255))
canvas.alpha_composite(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
canvas.resize((512, 512), Image.Resampling.LANCZOS).save(output)
print(output)
