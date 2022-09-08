
const { LC, Statement, Environment } = require( '../classes/all.js' )
const fs = require( 'fs' )
const path = require( 'path' )
const database = [ ]
const add = ( source, otherMetadata, text ) => {
    const metadata = Object.assign(
        { file : source, original : text }, otherMetadata )
    try {
        const lcs = LC.fromString( text )
        if ( !lcs ) return
        database.push( Object.assign( { lcs : lcs }, metadata ) )
    } catch ( e ) {
        console.log( 'Trying to interpret this text:' )
        console.log( text )
        console.log( 'Metadata:', JSON.stringify( metadata ) )
        console.log( 'Error:', e )
        throw e
    }
    // console.log( 'Added:', JSON.stringify( metadata ) )
}

// classes/DeclarationExamples.js
let toLoad = path.join( __dirname, '..', 'classes', 'DeclarationExamples.js' )
let text = String( fs.readFileSync( toLoad ) )
text.split( '\n\n' ).forEach( ( bit, index ) => {
    const lines = bit.trim().split( '\n' )
    let match = /^\/\/ NAME: (.*)$/.exec( lines[0] )
    if ( !match ) return
    const name = match[1]
    match = /^\/\/ VALID: (.*)$/.exec( lines[1] )
    if ( !match ) return
    const valid = match[1]
    add( 'classes/DeclarationExamples.js',
         { name : name, valid : valid, index : index },
         lines.slice( 2 ).join( '\n' ) )
} )

// scripts/init.js
toLoad = path.join( __dirname, '..', 'scripts', 'init.js' )
text = String( fs.readFileSync( toLoad ) )
let index = 0
while ( index > -1 ) {
    const match = /let ([a-zA-Z0-9]+)\s*=\s*lc\(`([^`]+)`\)/.exec(
        text.substring( index ) )
    if ( match ) {
        index += match.index + match[0].length
        add( 'scripts/init.js', { name : match[1] }, match[2] )
    } else {
        index = -1
    }
}

// test/data/AllofLurch.js (script)
toLoad = path.join( __dirname, '..', 'test', 'data', 'AllofLurch.js' )
text = String( fs.readFileSync( toLoad ) )
index = 0
while ( index > -1 ) {
    const match = /\s([a-zA-Z0-9]+)\s*=\s*`([^`]+)`/.exec(
        text.substring( index ) )
    if ( match ) {
        index += match.index + match[0].length
        add( 'test/data/AllofLurch.js', { name : match[1] }, match[2] )
    } else {
        index = -1
    }
}

// test/data/EvenMoreLurchTxt.js (source)
toLoad = path.join( __dirname, '..', 'test', 'data', 'EvenMoreLurchTxt.js' )
text = String( fs.readFileSync( toLoad ) )
add( 'test/data/EvenMoreLurchTxt.js', { }, text )

// test/data/MPCPFExampleTxt.js (source)
toLoad = path.join( __dirname, '..', 'test', 'data', 'MPCPFExampleTxt.js' )
text = String( fs.readFileSync( toLoad ) )
add( 'test/data/MPCPFExampleTxt.js', { }, text )

// test/data/PropProofsTxt.js (source)
toLoad = path.join( __dirname, '..', 'test', 'data', 'PropProofsTxt.js' )
text = String( fs.readFileSync( toLoad ) )
add( 'test/data/PropProofsTxt.js', { }, text )

// test/data/turnstile-db.js (script)
const tdb = require( '../test/data/turnstile-db' )
for ( let i = 0 ; i < tdb.size() ; i++ ) {
    const t = tdb.getTest( i )
    const meta = Object.assign( { result : t.result }, t.metadata )
    const original = `${t.metadata.original}`
    delete t.metadata.original
    add( 'test/data/turnstile-db.js', meta, original )
}

// ooh!  done!
const sanitize = text =>
    text.split( '/' ).last().replace( '.js', '' )
const indent = text => '    ' + text.replace( /\n/g, '\n    ' )
const toPutdown = lc => {
    const given = lc.isAGiven ? ':' : ''
    const recur = lc.children().map( toPutdown )
    if ( lc instanceof Statement ) {
        // atomic case:
        if ( lc.children().length == 0 ) return given + lc.identifier
        // application case:
        if ( !lc.isAQuantifier )
            return given + '(' + [ lc.identifier, ...recur ].join( ' ' ) + ')'
        // binding case:
        return given + '('
             + [ lc.identifier, ...recur.slice( 0, recur.length-1 ) ].join( ' ' )
             + ' , ' + recur.last() + ')'
    } else if ( lc instanceof Environment ) {
        // environment:
        if ( lc.declaration == 'none' )
            return given + '{\n' + indent( recur.join( '\n' ) ) + '\n}'
        // variable declaration:
        if ( lc.declaration == 'variable' )
            return given + '[' + recur.slice( 0, recur.length-1 ).join( ' ' )
                 + ' var ' + recur.last() + ']'
        // constant declaration:
        if ( lc.declaration == 'constant' )
            return given + '[' + recur.slice( 0, recur.length-1 ).join( ' ' )
                 + ' const ' + recur.last() + ']'
    }
    throw new Error( 'toPutdown can\'t handle this: ' + lc.toString() )
}
const outDir = path.join( __dirname, 'gathered-database' )
database.forEach( ( entry, index ) => {
    let indexStr = `${index+1}`
    while ( indexStr.length < 3 ) indexStr = `0${indexStr}`
    const outFile = path.join( outDir,
        `${indexStr}-from-${sanitize(entry.file)}.putdown` )
    let outText = ''
    outText += '---\n'
    const mayQuote = text => /^[a-zA-Z0-9]+$/.test( text ) ? text : '"' + text + '"'
    for ( let key in entry )
        if ( key != 'lcs' && key != 'original' )
            outText += `${mayQuote(key)}: ${mayQuote(entry[key])}\n`
    outText += '---\n\n'
    if ( !entry.lcs ) {
        console.log( entry.original )
        throw new Error( JSON.stringify( entry ) )
    }
    outText += '// Putdown notation for this test:\n'
    outText += toPutdown( entry.lcs ) + '\n'
    outText += '\n'
    outText += '////// Original notation in old repo for this test:\n'
    entry.original.split( '\n' ).forEach( line =>
        outText += '// ' + line + '\n' )
    fs.writeFileSync( outFile, outText )
    console.log( `
******************
*
*  Wrote the following to the file ${outFile}
*
******************

${outText}

`)
} )
console.log( `${database.length} files written into ${outDir}` )
