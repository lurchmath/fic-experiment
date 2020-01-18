
# List of to-dos

 1. All the remaining stuff Ken has planned out in his Notability file
 2. The declaration attribute of the Environment class is a big enough deal
    that it ought to be its own separate first-class entity, just like
    Statement and Environment.  Separate it out (big project).
 3. The Statement class is badly named; it should be Expression, and have
    "isAStatement" as a computed attribute that is true for top-level
    Expressions only, so we can distinguish top-level from inner Expressions.
