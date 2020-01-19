
// Tests the functionality of the parser LC.fromString()

// import expect.js
let expect = require( 'expect.js' )

// import the relevant classes
const { LC, Statement, Environment } = require( '../classes/all.js' )

suite( 'Parsing', () => {

  let E = ( ...args ) => new Environment( ...args )
  let _E = ( ...args ) => {
    let result = new Environment( ...args )
    result.isAGiven = true
    return result
  }
  let F = ( ...args ) => {
    let result = new Environment( ...args )
    result.isAFormula = true
    return result
  }
  let _F = ( ...args ) => {
    let result = F( ...args )
    result.isAGiven = true
    return result
  }
  let I = ( text, ...args ) => {
    let result = new Statement( ...args )
    result.identifier = text
    return result
  }
  let _I = ( text, ...args ) => {
    let result = I( text, ...args )
    result.isAGiven = true
    return result
  }
  let D = ( ...args ) => {
    let result = new Environment( ...args )
    result.declaration = 'constant'
    return result
  }
  let _D = ( ...args ) => {
    let result = new Environment( ...args )
    result.declaration = 'constant'
    result.isAGiven = true
    return result
  }
  let L = ( ...args ) => {
    let result = new Environment( ...args )
    result.declaration = 'variable'
    return result
  }
  let _L = ( ...args ) => {
    let result = new Environment( ...args )
    result.declaration = 'variable'
    result.isAGiven = true
    return result
  }

  let compare = ( toParse, parsedForm ) => {
    let actual = LC.fromString( toParse )
    expect( actual.equals( parsedForm ) ).to.be( true )
    expect( actual.toString() ).to.be( parsedForm.toString() )
    let redone = LC.fromString( actual.toString() )
    expect( redone.equals( actual ) ).to.be( true )
    expect( redone.equals( parsedForm ) ).to.be( true )
  }
  let parsing = ( text ) => () => LC.fromString( text )

  test( 'The parsing function is defined', () => {
    expect( LC.fromString ).to.be.ok()
  } )

  test( 'It supports lone identifiers', () => {
    compare( 'A', I( 'A' ) )
    compare( 'Snufflupagus', I( 'Snufflupagus' ) )
    compare( '8675309', I( '8675309' ) )
    compare( '__x_9', I( '__x_9' ) )
  } )

  test( 'Lone identifiers can be surrounded by whitespace', () => {
    compare( '   A', I( 'A' ) )
    compare( ' Snufflupagus\t', I( 'Snufflupagus' ) )
    compare( '\n\n8675309', I( '8675309' ) )
    compare( ' __x_9     ', I( '__x_9' ) )
  } )

  test( 'It supports nonatomic statements', () => {
    compare( 'f(x)', I( 'f', I( 'x' ) ) )
    compare( 'eq(plus(sq(a),sq(b)),sq(c))',
             I( 'eq', I( 'plus', I( 'sq', I( 'a' ) ), I( 'sq', I( 'b' ) ) ),
                      I( 'sq', I( 'c' ) ) ) )
  } )

  test( 'Nonatomic statements can contain whitespace', () => {
    compare( 'f( x  \t   )', I( 'f', I( 'x' ) ) )
    compare( 'eq(\nplus(sq(a),       sq ( b )),\nsq(c))',
             I( 'eq', I( 'plus', I( 'sq', I( 'a' ) ), I( 'sq', I( 'b' ) ) ),
                      I( 'sq', I( 'c' ) ) ) )
  } )

  test( 'It supports nested environments', () => {
    compare( '{{}}', E( E( ) ) )
    compare( '{{}{}}', E( E( ), E( ) ) )
    compare( '{{}{{}}{}}', E( E( ), E( E( ) ), E( ) ) )
  } )

  test( 'It supports formulas containing environments', () => {
    compare( '[{}]', F( E( ) ) )
    compare( '[{}{}]', F( E( ), E( ) ) )
    compare( '[{}{{}}{}]', F( E( ), E( E( ) ), E( ) ) )
  } )

  test( 'Nested environments/formulas can contain whitespace', () => {
    compare( '   {{}}', E( E( ) ) )
    compare( '{ { }{ }} ', E( E( ), E( ) ) )
    compare( ' { { } { { } } { } } ', E( E( ), E( E( ) ), E( ) ) )
    compare( '[{    \t\t\t}]', F( E( ) ) )
    compare( '[{\n\n}{\n\n}]', F( E( ), E( ) ) )
    compare( ' [ {}\t{{}}\t{} ] ', F( E( ), E( E( ) ), E( ) ) )
  } )

  test( 'It supports adding given flags to anything', () => {
    compare( ':Snufflupagus', _I( 'Snufflupagus' ) )
    compare( ':8675309', _I( '8675309' ) )
    compare( ':W(x,y,z)', _I( 'W', I( 'x' ), I( 'y' ), I( 'z' ) ) )
    compare( ':{{}}', _E( E( ) ) )
    compare( '{:{}}', E( _E( ) ) )
    compare( ':{:{}}', _E( _E( ) ) )
    compare( ':[ :A B { :C D } ]',
             _F( _I( 'A' ), I( 'B' ), E( _I( 'C' ), I( 'D' ) ) ) )
    compare( ':{ :A B :C { :D E } }',
             _E( _I( 'A' ), I( 'B' ), _I( 'C' ), E( _I( 'D' ), I( 'E' ) ) ) )
  } )

  test( 'It supports adding quantifier flags to identifiers only', () => {
    Q = I( 'Snufflupagus' )
    Q.isAQuantifier = true
    compare( '~Snufflupagus', Q )
    Q = I( '8675309' )
    Q.isAQuantifier = true
    compare( '~8675309', Q )
    Q = I( 'W', I( 'x' ), I( 'y' ), I( 'z' ) )
    Q.isAQuantifier = true
    compare( '~W(x,y,z)', Q )
    Q = I( 'W', I( 'x' ), I( 'y' ), I( 'z' ) )
    Q.children()[0].isAQuantifier = true
    compare( 'W(~x,y,z)', Q )
    Q = I( 'W', I( 'x' ), I( 'y' ), I( 'z' ) )
    Q.children()[1].isAQuantifier = true
    compare( 'W(x,~y,z)', Q )
    Q = I( 'W', I( 'x' ), I( 'y' ), I( 'z' ) )
    Q.children()[2].isAQuantifier = true
    compare( 'W(x,y,~z)', Q )
    expect( parsing( '~{}' ) ).to.throwException( /environment.*quantifier/ )
    expect( parsing( '~[]' ) ).to.throwException( /formula.*quantifier/ )
  } )

  test( 'It throws errors for many different badly formed inputs', () => {
    expect( parsing( '{' ) ).to.throwException( /end of the input/ )
    expect( parsing( '[' ) ).to.throwException( /end of the input/ )
    expect( parsing( '~' ) ).to.throwException( /end of the input/ )
    expect( parsing( ':' ) ).to.throwException( /end of the input/ )
    expect( parsing( '{]' ) ).to.throwException( /ended.*bracket/ )
    expect( parsing( '[}' ) ).to.throwException( /ended.*bracket/ )
    expect( parsing( 'a b' ) ).to.throwException( /end of input/ )
    expect( parsing( 'a(x[b])' ) ).to.throwException( /inside a statement/ )
    expect( parsing( 'a(x{b})' ) ).to.throwException( /inside a statement/ )
    expect( parsing( '::x' ) ).to.throwException( /given/ )
    expect( parsing( '~~x' ) ).to.throwException( /quantifier/ )
    expect( parsing( ':~:x' ) ).to.throwException( /given/ )
    expect( parsing( ':~~x' ) ).to.throwException( /quantifier/ )
    expect( parsing( '}' ) ).to.throwException( /close bracket/ )
    expect( parsing( ']' ) ).to.throwException( /close bracket/ )
    expect( parsing( ')' ) ).to.throwException( /close paren/ )
    expect( parsing( '{(k)}' ) ).to.throwException( /open paren/ )
  } )

  test( '\'Let\' declarations parse as expected - even if illegal.', () => {
    compare( 'Let{ A B }', L( I('A'), I('B') ) )
    compare( 'Let{ A true }', L( I('A'), I('true') ) )
    compare( 'Let{ x y P(x,y) }', L( I('x'), I('y'), I( 'P', I('x'), I('y') ) ) )
    compare( '{ A Let{ x y P(x,y) } B }', E( I('A') , L( I('x'), I('y'), I( 'P', I('x'), I('y') ) ) , I('B') ) )
    compare( '{ Let{ x y P(x,y) } Let{ x y Q(x,y) } }', E( L( I('x'), I('y'), I( 'P', I('x'), I('y') ) ) , L( I('x'), I('y'), I( 'Q', I('x'), I('y') ) ) ) )
  } )

} )
