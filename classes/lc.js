
const { Structure } = require( '../dependencies/structure.js' )

class LC extends Structure {
}

class Statement extends LC {
}

class Environment extends LC {
}

module.exports.LC = LC
module.exports.Statement = Statement
module.exports.Environment = Environment
