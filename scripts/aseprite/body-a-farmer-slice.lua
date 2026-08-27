local source = app.params.source
local output = app.params.output

if not source or not output then
  error("Expected --script-param source=... and output=...")
end

local sprite = app.open(source)
if not sprite then
  error("Could not open " .. source)
end

local pixelColor = app.pixelColor
local transparent = pixelColor.rgba(0, 0, 0, 0)
local outfitLayer = sprite:newLayer()
outfitLayer.name = "Farmer Outfit"

local replacements = {
  [pixelColor.rgba(217, 160, 102, 255)] = {
    shirt = pixelColor.rgba(63, 143, 136, 255),
    trousers = pixelColor.rgba(111, 75, 62, 255),
  },
  [pixelColor.rgba(162, 101, 67, 255)] = {
    shirt = pixelColor.rgba(46, 105, 103, 255),
    trousers = pixelColor.rgba(82, 54, 47, 255),
  },
  [pixelColor.rgba(118, 61, 43, 255)] = {
    shirt = pixelColor.rgba(28, 71, 72, 255),
    trousers = pixelColor.rgba(53, 37, 35, 255),
  },
}

local function putPixel(image, x, y, color)
  if x >= 0 and x < image.width and y >= 0 and y < image.height then
    image:putPixel(x, y, color)
  end
end

for _, frame in ipairs(sprite.frames) do
  local composite = Image(sprite.spec)
  composite:drawSprite(sprite, frame.frameNumber)

  local bounds = composite:shrinkBounds()
  local outfit = Image(sprite.spec)
  outfit:clear(transparent)

  for y = 0, sprite.height - 1 do
    for x = 0, sprite.width - 1 do
      local sourcePixel = composite:getPixel(x, y)
      local replacement = replacements[sourcePixel]
      if replacement and y >= bounds.y + 14 and y <= bounds.y + 19 then
        outfit:putPixel(x, y, replacement.shirt)
      elseif replacement and y >= bounds.y + 20 then
        outfit:putPixel(x, y, replacement.trousers)
      end
    end
  end

  local hatTop = bounds.y - 3
  local hatLeft = bounds.x + 1
  local hatRight = bounds.x + bounds.width - 2
  local outline = pixelColor.rgba(123, 81, 47, 255)
  local straw = pixelColor.rgba(212, 162, 58, 255)
  local highlight = pixelColor.rgba(240, 200, 90, 255)

  for x = hatLeft + 2, hatRight - 2 do
    putPixel(outfit, x, hatTop, outline)
    putPixel(outfit, x, hatTop + 1, straw)
  end
  for x = hatLeft + 1, hatRight - 1 do
    putPixel(outfit, x, hatTop + 2, straw)
  end
  for x = hatLeft - 1, hatRight + 1 do
    putPixel(outfit, x, hatTop + 3, outline)
  end
  for x = hatLeft, hatRight do
    putPixel(outfit, x, hatTop + 3, straw)
  end
  for x = hatLeft + 3, hatRight - 3 do
    putPixel(outfit, x, hatTop + 1, highlight)
  end

  sprite:newCel(outfitLayer, frame, outfit, Point(0, 0))
end

sprite:saveAs(output)
sprite:close()