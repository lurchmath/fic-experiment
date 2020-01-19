
# List of to-dos

 1. All the remaining stuff Ken has planned out in his Notability file
     * Limit `derives()` to not drill inside declarations.
     * Add declaration rules to `derives()`.
     * Extend `derives()` with matching.
     * Extend the validation routine to first validate scopes/declarations,
       then when passing a formula to `derives()`, first replace all its
       variables with metavariables.
 1. Make extensive testing easier
     * Create a new `test/text-files.js` script that contains a single `suite()`
       call, but then within that function, it loops through all text files in a
       chosen directory, each of which should contain LC notation of a document,
       plus the X and check that indicate how it ought to validate.  For each
       such file, do these things inside a `test()` call named for that file:
     * Load the content and store it in a string variable, say, `original`.
     * Strip the X and check codes, thus creating something parse-able through
       `LC.fromString()`, and do that parsing, storing the result again; let's
       call it `asLC`.
     * Validate the whole thing, and then generate a `toString(true)`
       representation of it, thus containing X and check marks.
     * Compare that string with `original`, after having replaced all sequences
       of whitespace with a single space in both strings, with `expect()`.
 1. Clean up existing code
     * Use the new `Let{...}` and `Declare{...}` parsing features in tests.
 1. The declaration attribute of the Environment class is a big enough deal
    that it ought to be its own separate first-class entity, just like
    Statement and Environment.  Separate it out (big project).
 1. The Statement class is badly named; it should be Expression, and have
    "isAStatement" as a computed attribute that is true for top-level
    Expressions only, so we can distinguish top-level from inner Expressions.
 1. Create lots of utility functions to clean up code (e.g., array `without()`,
    plus var list getters for quantifiers and declarations, etc.).
