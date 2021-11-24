//
//  MPCPFexampleTxt.js - stores a giant string that contains a good example
//  of validation by MP+CP+F

{ ////// header
  // factoring these out to reduce clutter
  :{ Declare{ ⊆ = ∈ ⇒ { } }
    // EEs (misnomer, but no big deal for now)
    { :Let{ x ∈(x,∩(A,B)) } ∈(x,∩(A,B)) }
    { :Let{ y ∈(y,A) } ∈(y,A) }
    // UEs from first pass of MP+CP+F validation
    { :{ ⊆(S,S) }
        { ⊆(A,A) }}
    { :{ :∈(z,∩(S,T)) ∈(z,S) ∈(z,T) }
        { :∈(x,∩(A,B)) ∈(x,A) ∈(x,B) }}
    { :{ :⊆(S,T) :∈(z,S) ∈(z,T) }
        { :⊆(A,B) :∈(y,A) ∈(y,B) }}
    { :{ :∈(z,S) :∈(z,T) ∈(z,∩(S,T)) }
        { :∈(y,A) :∈(y,B) ∈(y,∩(A,B)) }}
    // UEs from the second pass of MP+CP+F validation
    { :{ :{ :Let{ z ∈(z,S) } ∈(z,T) } ⊆(S,T) }
        { :{ :Let{ x ∈(x,∩(A,B)) } ∈(x,A) } ⊆(∩(A,B),A) } }
    { :{ :{ :Let{ z ∈(z,S) } ∈(z,T) } ⊆(S,T) }
        { :{ :Let{ y ∈(y,A) } ∈(y,∩(A,B))  } ⊆(A,∩(A,B)) } }
    // UEs from third pass of MP+CP+F validation
    { :{ :⊆(S,T) :⊆(T,S) =(S,T) }
        { :⊆(∩(A,B),A) :⊆(A,∩(A,B)) =(∩(A,B),A) }}
    // UEs from fourth pass of MP+CP+F validation
    { :{ :{ :P Q } ⇒(P,Q) }
        { :{ :⊆(A,B) =(∩(A,B),A) } ⇒(⊆(A,B),=(∩(A,B),A)) }}
  }

  ////// dependencies (hidden)
  :Declare{ ⊆ = ∈ ⇒ { } }  // constant declarations
  :{ :{ :P Q } ⇒(P,Q) }  // implies+
  :{ :⊆(S,T) :∈(z,S) ∈(z,T) }  // subset-
  :{ :{ :Let{ z ∈(z,S) } ∈(z,T) } ⊆(S,T)  }  // subset+
  :{ :⊆(S,T) :⊆(T,S) =(S,T) }  // set equality+
  :{ :∈(z,S) :∈(z,T) ∈(z,∩(S,T)) }  // intersection+
  :{ :∈(z,∩(S,T)) ∈(z,S) ∈(z,T) }  // intersection-
  :{ ⊆(S,S) }  // previous theorem

  ////// user's document (visible)
  // Theorem 1
  { =(∩(A,A),A) }
  // Proof of Theorem 1
  { ⊆(A,A) }
  // Theorem 2
  { ⇒(⊆(A,B),=(∩(A,B),A)) }
  // Proof of Theorem 2
  { :⊆(A,B)
     =(∩(A,B),A)
     ⊆(∩(A,B),A)
     { :Let{ x ∈(x,∩(A,B)) }
       ∈(x,A)
     }
     ⊆(A,∩(A,B))
     { :Let{ y ∈(y,A) }
       ∈(y,B)
       ∈(y,∩(A,B))
     }
  }
}
