# jovan-ng · portfolio

Personal portfolio of Jovan Ng: CS (Intelligent Systems) + Biomedical Engineering at UC Irvine, now doing applied ML research in computational biology. The site's job is to carry the work that GitHub can't fully show yet, including two research projects that stay narrative-only until publication.

Built by hand. No frameworks, no build step; the only external dependency is Google Fonts.

## Design

The design direction is called Residue: protein language models treat amino acid sequences as text, and the site treats its own text the same way.

- Section labels are FASTA headers (`>work`, `>about`)
- The strip along the top encodes magainin 2, an antimicrobial peptide, colored by residue class, and doubles as a scroll progress bar with section markers
- Text decodes through the amino acid alphabet as it enters the viewport, and single letters keep flickering afterward
- Project domains are color-coded chips (ml / bio / systems / web) that filter the work section
- Type: Newsreader (display), Archivo (body), Fragment Mono (metadata)

All motion is gated behind `prefers-reduced-motion`, and the page is complete without JavaScript.

## Structure

```
index.html        single page: hero, work, about, skills, contact
css/style.css     all styling, custom properties at the top
js/script.js      residue strips, decode + flicker, progress, filters
assets/           images
projects.html     redirect stub kept for old URLs
contact.html      redirect stub kept for old URLs
```

## Run locally

Any static server works:

```
python -m http.server 8137
```

Then open http://localhost:8137.

## Status

Some featured repos are being renamed and documented before going public; the site links them as they land. Contribution notes on group projects live in each entry.
