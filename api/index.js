const React = require("react");
const { renderToString } = require("react-dom/server");
const Avatar = require("boring-avatars").default;
const sharp = require("sharp");

const DEFAULT_COLORS = [
  "#92A1C6",
  "#146A7C",
  "#F0AB3D",
  "#C271B4",
  "#C20D90",
].join(",");
const DEFAULT_SIZE = 80;
const DEFAULT_VARIANT = "marble";

const VALID_VARIANTS = new Set([
  "marble",
  "beam",
  "pixel",
  "sunset",
  "ring",
  "bauhaus",
]);

function normalizeColors(colors) {
  const colorPalette = colors.split(",");

  if (colorPalette.length) {
    return colorPalette.map((color) =>
      color.startsWith("#") ? color : `#${color}`
    );
  }
}

const app = require("express")();

app.get("/favicon.ico", (req, res) => {
  res.sendStatus(204);
});

app.get("/:variant?/:size?/:name?", async (req, res) => {
  const { variant = DEFAULT_VARIANT, size = DEFAULT_SIZE } = req.params;
  const explicitName = req.query.name || req.params.name;
  const name = explicitName || Math.random().toString();
  const colors = normalizeColors(req.query.colors || DEFAULT_COLORS);
  const square = req.query.hasOwnProperty("square");
  const isConvertToPng = req.query.hasOwnProperty("png");

  if (!VALID_VARIANTS.has(variant)) {
    return res.status(400).send("Invalid variant");
  }

  res.setHeader("Content-Type", `image/${isConvertToPng ? 'png' : 'svg+xml'}`);

  if (explicitName) {
    res.setHeader("Cache-Control", "max-age=0, s-maxage=2592000");
  } else {
    res.setHeader("Cache-control", "max-age=0, s-maxage=1");
  }

  const svg = renderToString(
    React.createElement(
      Avatar,
      {
        size,
        name,
        variant,
        colors,
        square,
      },
      null
    )
  );

  if (isConvertToPng) {
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    
    const img = Buffer.from(pngBuffer, 'base64');
    res.setHeader('Content-Length', img.length);
  
    res.end(img);
  } else {
    res.end(svg);
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on ${port}, http://localhost:${port}`);
});
