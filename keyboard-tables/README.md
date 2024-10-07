# Keyboard module

Converts keyboard layout data from KLC files into JavaScript code that can be imported as a module.

A KLC file is the Unicode-encoded output of Microsoft's Keyboard Layout Creator (MSKLC).

When first started, `import_kbd.py` downloads a set of KLC files from https://kbdlayout.info/ into the subdirectory `./klc`.
