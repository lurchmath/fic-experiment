
# List of to-dos

 1. All the remaining stuff Ken has planned out in his Notability file
 2. Incorporate a real test suite to prevent regression
 3. Start using Structure attributes and copying correctly, as follows:
    a. Fix bug in Structure class where `copy()` doesn't use
       `Structure::subclasses[this.className()]`
    b. Stop using JS attributes like `this._given` in LC/Statement/Environment
       classes and start using Structure attributes like
       `this.setAttribute(k,v)` and `this.getAttribute(k)`
    c. Remove the custom `copy()` methods in the LC/Statement/Environment
       classes, because they're no longer needed
