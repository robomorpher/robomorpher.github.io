# RoboMorpher

Project website for **RoboMorpher: Scaling Robot Morphology Representations for Cross-Embodiment Action Prediction**.

Website: https://robomorpher.github.io/

The static website includes the manuscript, looping morphology and benchmark task videos, method figures, complete result tables, and a copyable BibTeX citation. Author names and institution logos follow the supplied project author list.

## Development

Serve the repository root with a static HTTP server:

```sh
python3 -m http.server 4173
```

GitHub Pages publishes the `main` branch from the repository root. `.nojekyll` keeps the HTML, CSS, JavaScript, and assets unchanged during publication.

### Updating figures and results

Results tables are rendered into `index.html`, so they remain available when opened
locally or with JavaScript disabled. After editing `results.json`, regenerate them:

```sh
python3 scripts/build_results.py
```

To regenerate the animated architecture SVG from the shape-based source slide:

```sh
python3 scripts/export_architecture.py /absolute/path/to/RoboMorpher_architecture_polished.pptx
```

The SVG preserves the slide's layout and text, animates the connectors, and disables
animation for visitors who prefer reduced motion.
