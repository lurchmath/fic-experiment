const { Structure } = require( '../dependencies/structure.js' )
const { OM } = require( './openmath.js' )
const { LC, lc } = require( '../classes/lc.js' )
const { isMetavariable, setMetavariable, clearMetavariable } =
  require( './matching.js' )
const { Step } = require( '../classes/step.js' )
const compute = require( 'algebrite' )
const chalk = require( 'chalk' )

// convenience renaming
let print = console.log

// You can add the following five as args to .show()
// Show defaults to .show(Color,Indent) to prevent it from marking or
// Validating when you just want to view the LC, not alter it.
let Conc        = { Conc: true }
let Env         = { Env: true }
let Bound       = { Bound: true }
let Color       = { Color: true }
let Indent      = { Indent: true }
let EEs         = { EEs: true }
let Skolem      = { Skolem: true }
let Compact     = { Compact:true }
let Flat        = { Color:true, Conc:true, Env:true, Bound:true }
let All         = { Conc:true, Env:true, Bound:true, Color:true,
                    Indent:true, EEs:true, Skolem: true }
let None        = { }

let colorize = ( x, col , font ) => {
  return ( col ) ? ( ( font ) ? chalk[col][font](x) : chalk[col](x) ) : x
}

let help = ( command ) => {
  if (!command) {
    print(colorize(`
Type help(command) for help on the following commands.
(The command string must be in quotes.)

      lc  show  Validate compute
    `,'grey'))
  } else {
    let topics = {
    lc: `
lc( S )

  - constructs and returns the LC X.fromString(S).
    `,
    show: `
X.show( options )

  - prints a formatted version of the LC X.

    Options can be zero or more of the following in any order (no quotes needed).
    The default for no arguments is .show(Indent,Color,Bound,Conc,Env).

      Indent  : nests and indents the environment heirarchy
      Color   : use syntax highlighting
      Bound   : show validation for bound variables
      Conc    : show validation of conclusions
      Env     : show validation of conclusion-environments

      Compact : suppress line breaks after opening { in Indent mode
      EEs     : show inserted EEs
      Skolem  : show Skolemized constant names
      All     : show everything above
      None    : just show a flat monochromatic string.
      Flat    : show a flat colored string with all validation icons
     `,
    Validate: `
X.Validate( showtimes )

  - For any LC X, checks if X is valid via SAT and returns true or false.
     `,
    compute: `
compute.run( mathstring )

  - uses Algebrite to evaluate the math expression string.

    Example: compute.run('1+1') returns '2'

    See the Algebrite command reference for details.  You can access them by
    pressing CMD+doubleclick on the following URL in the MacOS terminal in Lode:

      http://algebrite.org/docs/latest-stable/reference.html
     `
    }
    if (topics.hasOwnProperty(command)) {
       print(colorize(topics[command],'grey'))
    } else {
       print(colorize(`No help available for `,'red')+
             colorize(command,'redBright')+
           colorize(`.`,'red'))

    }
  }
}

module.exports.Conc     = Conc
module.exports.Env      = Env
module.exports.Bound    = Bound
module.exports.Color    = Color
module.exports.Indent   = Indent
module.exports.EEs      = EEs
module.exports.Skolem   = Skolem
module.exports.Compact  = Compact
module.exports.Flat     = Flat
module.exports.All      = All
module.exports.None     = None
module.exports.colorize = colorize
module.exports.help     = help
module.exports.print    = print
module.exports.compute  = compute
module.exports.chalk    = chalk
