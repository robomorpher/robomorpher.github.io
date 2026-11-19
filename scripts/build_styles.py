"""Bundle styles in cascade order; run after editing source CSS."""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
files = ['styles.css', 'hero.css', 'morphgen.css', 'content.css', 'overview.css', 'bench.css', 'results.css']
(root / 'site.css').write_text('\n'.join((root / name).read_text() for name in files))
