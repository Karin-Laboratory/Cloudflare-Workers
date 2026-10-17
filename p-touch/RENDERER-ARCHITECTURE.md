# P-touch Studio exact renderer integration

## Goal
Browser preview and actual print must be generated from the **same upstream P-touch Studio rendering output**, not two independently implemented layout engines.

## Verified upstream
https://github.com/tombueng/ptouch-studio (MIT)
Its documented pipeline: Qt layout -> PDF with exact physical page dimensions -> CUPS -> rastertoptch -> RFCOMM -> PT-P710BT.
The upstream README documents 9.9 mm printable height for 12 mm tape, and measured-glyph font sizing.

## Proposed Raspberry Pi 3 architecture
1. Web editor submits a validated JSON job (text, tape width, margins, fonts, image, QR/barcode, mirror, cut settings) to a locally authenticated Pi API.
2. Pi invokes a **shared extracted/refactored upstream layout function** to produce a PDF with exact physical geometry. This requires implementing a headless interface; the upstream CLI PDF option can be used initially, subject to its option coverage.
3. For **preview**, convert that PDF through the **same CUPS raster filter and settings** as print, decode the raster, and display the resulting monochrome dots. Avoid independent Canvas text rendering.
4. For **print**, send the **identical PDF/job parameters** through the configured CUPS queue and RFCOMM backend. Check loaded tape status before printing.
5. Compare decoded preview raster with CUPS raster destined for printer using SHA-256. Include test fixtures for 3.5, 6, 9, 12, 18 and 24 mm, Japanese fonts, images, QR, alignment, margins, frame and multiline text.
6. Hardware-verify printable area, orientation, feeding and cutter behavior with PT-P710BT.

## Status
- Existing browser v0.2 raster is **not** the upstream engine; 180dpi/widths are provisional.
- Raspberry Pi backend, headless upstream integration, CUPS roundtrip raster decoder, and real-printer tests are **not implemented**.
- Do not claim dot-perfect equivalence until binary raster comparison and physical tests pass.

## Safety
Only accept authenticated requests; validate media sizes, job dimensions and image limits. Never pass user-provided text to a shell. Keep Bluetooth and CUPS reachable only on the Pi, and avoid exposing the print API without access controls.
