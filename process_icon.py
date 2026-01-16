from PIL import Image
import os

def process_icon():
    try:
        # Open the uploaded jpg
        img = Image.open('raw_icon.jpg').convert("RGBA")
        print(f"Original size: {img.size}")

        target_size = (1024, 1024)
        new_img = Image.new("RGBA", target_size, (0, 0, 0, 0))
        
        # Scale logic
        scale_factor = min(target_size[0] / img.width, target_size[1] / img.height) * 0.8
        new_width = int(img.width * scale_factor)
        new_height = int(img.height * scale_factor)
        
        resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        pos_x = (target_size[0] - new_width) // 2
        pos_y = (target_size[1] - new_height) // 2
        
        new_img.paste(resized_img, (pos_x, pos_y), resized_img)
        
        # Save as icon.png
        new_img.save('icon.png', 'PNG')
        print(f"Successfully created icon.png {new_img.size}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process_icon()
