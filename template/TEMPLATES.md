Templates are stored with `<input>-<output>` filenames. When the output is `write`
the *back* card should start with `strokes`. When the output is `mean` the *back*
card should start with `meaning`.

To prevent double audio replay, the *back* card of `hear` input includes the
entire `{{FrontSide}}`. This requires some creative CSS hiding to get the desired
field order, as some fields need to be part of the front card, but hidden.
