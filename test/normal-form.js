
// Tests the Normal Form routine

// import expect.js
let expect = require( 'expect.js' )

// import all classes defined in this repo
const { OM, Structure, LC, Statement, Environment } =
  require( '../classes/all.js' )

let compare = ( A , B ) => LC.fromString(A).normalForm().equals(
                           LC.fromString(B))

suite( 'Normal Form', () => {

  test( 'Statements are their own normal form.', () => {
    expect( compare('A','A') ).to.be(true)
    expect( compare(':A',':A') ).to.be(true)
  } )

  test( 'Trivial LCs have normal form { }.', () => {
    expect( compare('{}','{}') ).to.be(true)
    expect( compare(':{}','{}') ).to.be(true)
    expect( compare('{ :A }','{}') ).to.be(true)
    expect( compare('{ :A :B }','{}') ).to.be(true)
    expect( compare('{ :A :B :C }','{}') ).to.be(true)
    expect( compare('{ :A :B :C :D }','{}') ).to.be(true)
    expect( compare('{ {} }','{}') ).to.be(true)
    expect( compare('{ {} :B }','{}') ).to.be(true)
    expect( compare('{ {} :B :C }','{}') ).to.be(true)
    expect( compare('{ :A {} }','{}') ).to.be(true)
    expect( compare('{ :A {} :C }','{}') ).to.be(true)
    expect( compare('{ :A :B {} }','{}') ).to.be(true)
    expect( compare('{ { {} } }','{}') ).to.be(true)
    expect( compare('{ { {} } :B }','{}') ).to.be(true)
    expect( compare('{ :A { {} } }','{}') ).to.be(true)
    expect( compare('{ { :A } { {} } }','{}') ).to.be(true)
    expect( compare('{ { :A {} } { {} } }','{}') ).to.be(true)
    expect( compare(':{ { :A { :B } } { {} } }','{}') ).to.be(true)
    expect( compare('{ { :A { :B } } { { :A } } }','{}') ).to.be(true)
    expect( compare('{ { :A { :B } { :C :C } } { { :A } } }','{}') ).to.be(true)
    expect( compare('{ {} {} }','{}') ).to.be(true)
    expect( compare('{ { :A } { :B } }','{}') ).to.be(true)
    expect( compare('{ { :A {} } { {} :B } }','{}') ).to.be(true)
    expect( compare('{ {{ :A {} } { {} :B }} }','{}') ).to.be(true)
    expect( compare('{ { :A :B } { :C :D } }','{}') ).to.be(true)
    expect( compare(':{ :A { :B :C } { {:C :D} :E } }','{}') ).to.be(true)
    expect( compare('{ :{ A } }','{}') ).to.be(true)
    expect( compare('{ :{ A B } }','{}') ).to.be(true)
    expect( compare('{ :{ A B } :B }','{}') ).to.be(true)
    expect( compare('{ :{ :A B } :B }','{}') ).to.be(true)
    expect( compare('{ :{ A :B } :B }','{}') ).to.be(true)
    expect( compare('{ :{ A B } :{ B C } }','{}') ).to.be(true)
    expect( compare(':{ { :{ A B } :{ B C }} }','{}') ).to.be(true)
    expect( compare('{ { :{ A B } :{ B C } } :{ D } }','{}') ).to.be(true)
  } )

  test( 'If B is trivial then {A} and {A B} have normal form N(A).', () => {
    expect( compare('{ A }','A') ).to.be(true)
    expect( compare('{ { A } }','A') ).to.be(true)
    expect( compare('{ { { A B } } }','{A B}') ).to.be(true)
    expect( compare('{ { { :A B } } }','{:A B}') ).to.be(true)
    expect( compare('{ { :A B } }','{:A B}') ).to.be(true)
    expect( compare('{ A {} }','A') ).to.be(true)
    expect( compare(':{ A {} }',':A') ).to.be(true)
    expect( compare('{ A :B }','A') ).to.be(true)
    expect( compare('{ A { :B } }','A') ).to.be(true)
    expect( compare('{ A { {} :B } }','A') ).to.be(true)
    expect( compare(':{ A { {} :B } }',':A') ).to.be(true)
    expect( compare('{ {A :B} { :D {:B :C} } }','A') ).to.be(true)
    expect( compare('{ {A :B} { :D :{ B C } } }','A') ).to.be(true)
    expect( compare('{ {:A B} :{ :D { B C } } }','{:A B}') ).to.be(true)
    expect( compare('{ {{A B} :C} :{ :D { B C } } }','{A B}') ).to.be(true)
    expect( compare(':{ {{A B} :C} :{ :D { B C } } }',':{A B}') ).to.be(true)
  } )

  test( 'If N(B)={} then {B A} also has normal form N(A).', () => {
    expect( compare('{  {} A}','A') ).to.be(true)
    expect( compare('{ :{} A}','A') ).to.be(true)
    expect( compare('{ { :B } A }','A') ).to.be(true)
    expect( compare('{ { :B :C } A }','A') ).to.be(true)
    expect( compare('{ { :B {} :C } A}','A') ).to.be(true)
    expect( compare('{ :{ {} } A}','A') ).to.be(true)
    expect( compare('{ :{ {} :B } {A}}','A') ).to.be(true)
    expect( compare('{ :{ {} :B } {:A C} }','{ :A C }') ).to.be(true)
    expect( compare(':{ { {} :{ B } } { {A C} } }',':{ A C }') ).to.be(true)
    expect( compare('{ { {} :{ B } } { {A C} } }','{ A C }') ).to.be(true)
    expect( compare(':{ {A C} }',':{ A C }') ).to.be(true)
    expect( compare('{ {A C} }','{ A C }') ).to.be(true)
  } )

  test( 'Otherwise, N({A B}) = { N(A) N(B) }.', () => {
    expect( compare('{ A B }','{ A B }') ).to.be(true)
    expect( compare(':{ A B }',':{ A B }') ).to.be(true)
    expect( compare('{ {A B} }','{ A B }') ).to.be(true)
    expect( compare(':{ :{A B} }','{ }') ).to.be(true)
    expect( compare('{ {} {A B} }','{A B}') ).to.be(true)
    expect( compare(':{ {} {A B} }',':{A B}') ).to.be(true)
    expect( compare('{ :{{ :C } :D} { { {} A} { B {} } } }','{A B}') ).to.be(true)
    expect( compare('{ { { { {} A} { B {} } } :{{ :C } :D} } }','{A B}') ).to.be(true)
  } )

  test( 'And N({:A B}) = { :N(A) N(B) }.', () => {
    expect( compare('{ :A B }','{ :A B }') ).to.be(true)
    expect( compare(':{ :A B }',':{ :A B }') ).to.be(true)
    expect( compare('{ {:A B} }','{ :A B }') ).to.be(true)
    expect( compare(':{ :{:A B} }','{ }') ).to.be(true)
    expect( compare('{ {} {:A B} }','{:A B}') ).to.be(true)
    expect( compare(':{ {} {:A B} }',':{:A B}') ).to.be(true)
    expect( compare('{ :{{ :C } :D} { :{ {} A} { B {} } } }','{:A B}') ).to.be(true)
    expect( compare('{ { { :{ {} A :C } { B { :D :E } } } :{{ :C } :D} } }','{:A B}') ).to.be(true)
    expect( compare(':{ { { :{ {} A :C } { B { :D :E } } } :{{ :C } :D} } }',':{:A B}') ).to.be(true)
    expect( compare('{ :{ { :{ {} A :C } { B { :D :E } } } :{{ :C } :D} } }','{}') ).to.be(true)
  } )

} )
