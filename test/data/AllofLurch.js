//
//  AllofLurch.js - stores a giant string that contains a good chunk of the
//  Lurch desktop libraries followed by a few proofs for testing purposes.
//  We store it in a separate file since it's 600 lines long, and then just
//  import it as needed.

const AllofLurchstr = `{

   ///////////////////////
   // Proposotional Logic
   ///////////////////////
   // Propositional Logic Axioms
   // and+
   :{ :{ W V } and(W,V) and(V,W) }
   // and-
   :{ :and(W,V) W V }
   // or+
   :{ :W or(W,V) or(V,W) }
   // or-
   :{ :or(W,V) :{ :W R } :{ :W R } R }
   // ⇒+
   :{ :{ :W V } ⇒(W,V) }
   // ⇒-
   :{ :W :⇒(W,V) V }
   // ⇔+
   :{ :{ :W V } :{ :V W } ⇔(W,V) }
   // ⇔-
   :{ :⇔(W,V) { :V W } { :W V } }
   // ¬+
   :{ :{ :W →← } ¬(W) }
   // ¬-
   :{ :{ :¬(W) →← } W }
   // →←+
   :{ :W :¬(W) →← }

   // Propositional Logic Theorems
   // Famous Tautologies
   // __ excluded middle ______________________________
   :or(P,¬(P))
   // __ double negative ______________________________
   :⇔(¬(¬(P)),P)
   // __ idempotency __________________________________
   :⇔(and(P,P),P)
   :⇔(or(P,P),P)
   // __ commutativity ________________________________
   :⇔(and(P,Q),and(Q,P))
   :⇔(or(P,Q),or(Q,P))
   :⇔(⇔(P,Q),⇔(Q,P))
   // __ associativity ________________________________
   :⇔(and(and(P,Q),R),and(P,and(Q,R)))
   :⇔(or(or(P,Q),R),or(P,or(Q,R)))
   :⇔(⇔(⇔(P,Q),R),⇔(P,⇔(Q,R)))
   // __ distributivity _______________________________
   :⇔(and(P,or(Q,R)),or(and(P,Q),and(P,R)))
   :⇔(or(P,and(Q,R)),and(or(P,Q),or(P,R)))
   // __ transitivity _________________________________
   :⇒(and(⇒(P,Q),⇒(Q,R)),⇒(P,R))
   :⇔(and(⇔(P,Q),⇔(Q,R)),⇔(P,R))
   // __ alternate implies _(⇒)________________________
   :⇔(⇒(P,Q),or(¬(P),Q))
   // __ alternate or- _(or, or-)______________________
   :⇒(and(or(P,Q),¬(P)),Q)
   :⇒(and(or(P,Q),¬(Q)),P)
   // __ negation of an implication _(not ⇒)___________
   :⇔(¬(⇒(P,Q)),and(P,¬(Q)))
   // __ contrapositive _______________________________
   :⇔(⇒(P,Q),⇒(¬(Q),¬(P)))
   // __ DeMorgan _____________________________________
   :⇔(and(¬(P,Q)),or(¬(P),¬(Q)))
   :⇔(or(¬(P,Q)),and(¬(P),¬(Q)))

   // Predicate Logic Definitions and Axioms
   // _ ∀+ (or UG or ∀) _____________________________
   // Let x be arbitrary. If W then ∀z,W[x=z]. (Subject to the restriction that z cannot appear free in W if z is not equal to x. This is is checked by the built-in function free_to_replace(z,x,W))
   // _ ∀- (or UI or ∀) _____________________________
   // If ∀x,W then W[x=t]
   // _ ∃+ (or EG or ∃) _____________________________
   // If W[x=t] then ∃x,W
   // _ ∃- (or EI or ∃) _____________________________
   // If ∃x,W then for some constant c, W[x=c]
   //
   // Equality Definitions and Axioms
   // _ reflexive ____________________________________
   :=(x,x)
   // _ substitution _________________________________
   // If x=y and W then W[x~y]
   // _ ∃! ___________________________________________
   // ∃c,(W[x=c] and ∀z,W[x=z] ⇒ z=c) if and only if ∃!x,W
   // _ ≠ ____________________________________________
   :⇔(≠(x,y),¬(=(x,y)))

   // Predicate Logic with Equality Theorems
   // _ substitution ________________________
   // If x=y and W then W[y~x]
   // _ ∃! ____________________________________
   // ∃!x,P if and only if ∃c,∀z,P[x=z] ⇔ z=c

   // Set Theory Definitions and Axioms
   // _ finite set ___________________________________________
   :⇔(∈(x,set(a)),=(x,a))
   :⇔(∈(x,set(a,b)),or(=(x,a),=(x,b)))
   :⇔(∈(x,set(a,b,c)),or(=(x,a),=(x,b),=(x,c)))
   :⇔(∈(x,set(a,b,c,d)),or(=(x,a),=(x,b),=(x,c),=(x,d)))
   // _ set builder _________________________________________
   //:⇔(x∈{z : P} , P[z=x])
   // _ ⊆ (subset) __________________________________________
   :⇔(⊆(A,B),∀(x,⇒(∈(x,A),∈(x,B))))
   // _ set = (set equality) ________________________________
   :⇔(=(A,B),and(⊆(A,B),⊆(B,A)))
   // _ ∉ ____________________________________________________
   :⇔(∉(x,A),¬(∈(x,A)))
   // _ ∅ (empty set) ______________________________________
   :∉(x,∅)
   // _ ℘ (power set) _______________________________________
   :⇔(∈(A,℘(B)),⊆(A,B))
   // _ ∩ (intersection) ____________________________________
   :⇔(∈(x,∩(A,B)),and(∈(x,A),∈(x,B)))
   // _ ∪ (union) ___________________________________________
   :⇔(∈(x,∪(A,B)),or(∈(x,A),∈(x,B)))
   // _ − (relative complement) ___________________________
   :⇔(∈(x,-(A,B)),and(∈(x,A),∉(x,B)))
   // _ ' (complement) ____________________________________
   :⇔(∈(x,-(B)),∉(x,B))
   // _ ordered tuple (tuple)______________________________
   :⇔(=(tuple(a),tuple(x)),=(a,x))
   :⇔(=(tuple(a,b),tuple(x,y)),and(=(a,x),=(b,y)))
   :⇔(=(tuple(a,b,c),tuple(x,y,z)),and(=(a,x),=(b,y),=(c,z)))
   // _ Cartesian product __________________________________
   :⇔(∈(x,×(A,B)),∃(a,∃(b,and(∈(a,A),∈(b,B),=(x,tuple(a,b))))))
   :⇔(∈(x,×(A,B,C)),∃(a,∃(b,∃(c,and(∈(a,A),∈(b,B),∈(c,C),=(x,tuple(a,b,c)))))))

   // Set Theory Basic Theorems
   // _ finite set _________________________________________
   // We can conclude P if it is a valid expression of the form x∈A, ⊆(A,B), A⊂B, A=B, x∉A, or A≠B where A, B are finite sets in finite set notation (as checked by the built in function finite_set_valid(P))
   // _ ⊆ (subset) _________________________________________
   :⇒(and(⊆(A,B),∈(x,A)),∈(x,B))
   //  Let x be arbitrary. If assuming x∈A we have x∈B, then A⊆B
   // _ →← _(contradiction)_________________________________
   :⇒(and(∉(x,A),∈(x,A)),W)
   // _ ∅ (empty set) ______________________________________
   // :=(∅,{})
   // _ ∪ (union) __________________________________________
   :⇒(∈(x,A),and(∈(x,∪(A,B)),∈(x,∪(B,A))))
   // _ − (relative complement) ____________________________
   //:⇔(∈(x,−(A,B)),and(∈(x,A),¬(∈(x,B))))
   // _ ' (complement) _____________________________________
   :⇔(∈(x,-(A)),¬(∈(x,A)))
   // _ Cartesian product __________________________________
   :⇔(and(∈(a,A),∈(b,B)),∈(tuple(a,b),×(A,B)))
   :⇔(and(∈(a,A),∈(b,B),∈(c,C)),∈(tuple(a,b,c),×(A,B,C)))

   // Set Theory Theorems
   // __ excluded middle ______________________________
   :∈(x,∪(A,-(A)))
   :=(∩(A,-(A)),∅)
   // __ double negative ______________________________
   :=(-(-(A)),A)
   :=(-(B,-(A,B)),B)
   // __ idempotency __________________________________
   :=(∩(A,A),A)
   :=(∪(A,A),A)
   // __ commutativity ________________________________
   :=(∩(A,B),∩(B,A))
   :=(∪(A,B),∪(B,A))
   // __ associativity ________________________________
   :=(∩(A,∩(B,C)),∩(∩(A,B),C))
   :=(∪(A,∪(B,C)),∪(∪(A,B),C))
   // __ distributivity _______________________________
   :=(∩(A,∪(B,C)),∪(∩(A,B),∩(A,C)))
   :=(∪(A,∩(B,C)),∩(∪(A,B),∪(A,C)))
   // __ transitivity _________________________________
   :⇒(and(⊆(A,B),⊆(B,C)),⊆(A,C))
   // __ subset _______________________________________
   :⇔(⊆(A,B),∀(x,∈(x,∪(-(A),B))))
   :⇒(⊆(A,B),∈(x,∪(-(A),B)))
   :⇒(⊆(A,B),or(∉(x,A),∈(x,B)))
   :⇒(⊆(A,B),or(¬(∈(x,A)),∈(x,B)))
   // __ union ________________________________________
   :⇒(and(∈(x,∪(A,B)),¬(∈(x,A))),∈(x,B))
   :⇒(and(∈(x,∪(A,B)),¬(∈(x,B))),∈(x,A))
   :⇒(and(∈(x,∪(A,B)),∉(x,A)),∈(x,B))
   :⇒(and(∈(x,∪(A,B)),∉(x,B)),∈(x,A))
   // __ negation of subset ___________________________
   :⇔(¬(⊆(A,B)),∃(x,∈(x,∩(A,-(B)))))
   :⇒(∈(x,∩(A,-(B))),¬(⊆(A,B)))
   // __ contrapositive _______________________________
   :⇔(⊆(A,B),⊆(-(B),-(A)))
   // __ DeMorgan _____________________________________
   :=(-(∩(A,B)),∪(-(A),-(B)))
   :=(-(∪(A,B)),∩(-(A),-(B)))

   //  Function Definitions and Axioms
   //  _ function ______________________________________________
   :⇔(maps(f,A,B),and(⊆(f,×(A,B)),∀(x,∃!(y,∈(tuple(x,y),f)))))
   //  _ function application (f(x)) ___________________________
   :⇔(=(f(x),y),and(maps(f,A,B),∈(tuple(x,y),f)))
   //  _ domain ________________________________________________
   :⇔(=(Domain(f),A),maps(f,A,B))
   //  _ codomain ______________________________________________
   :⇔(=(Codomain(f),B),maps(f,A,B))
   //  _ image _________________________________________________
   :⇒(⊆(S,Domain(f)),=(f(S),setbuilder(x,∃(y,and(∈(y,S),=(x,f(y)))))))
   //  _ range _________________________________________________
   :=(Range(f),f(Domain(f)))
   //  _ identity map (id) _____________________________________
   :and(maps(id(A),A,A),∀(x,⇒(∈(x,A),=(id(A)(x),x))))
   //  _ composition (∘) _______________________________________
   :⇒(and(maps(f,A,B),maps(g,B,C)),and(maps(∘(g,f),A,C),∀(x,(=(∘(g,f))(x),g(f(x))))))
   //  _ injective (one to one or 1-1) _________________________
   :⇔(injective(f),∀(x,∀(y,⇒(=(f(x),f(y)),=(x,y)))))
   //  _ surjective (onto) _____________________________________
   :⇔(surjective(f),∀(y,⇒(∈(y,Codomain(f)),∃(x,=(f(x),y)))))
   //  _ bijective _____________________________________________
   :⇔(bijective(f),and(injective(f),surjective(f)))
   //  _ inverse function (inverse) ____________________________
   :⇔(maps(inverse(f),B,A),and(maps(f,A,B),=(∘(f,inverse(f)),id(B)),=(∘(inverse(f),f),id(A))))
   //  _ inverse image _________________________________________
   :⇒(and(maps(f,A,B),⊆(S,B)),=(inverseimage(f,S),setbuilder(x,∈(f(x),S))))

   //  Inequality Axioms
   //  _ trichotomy ________________________________________________________
   :or(=(x,0),<(x,0),<(0,x))
   //  -------------------------------------------------------------------
   :⇒(=(x,0),and(¬(<(x,0)),¬(<(0,x))))
   :⇒(<(x,0),and(¬(=(x,0)),¬(<(0,x))))
   :⇒(<(0,x),and(¬(=(x,0)),¬(<(x,0))))
   //  _ transitive __(transitivity)________________________________________
   :⇒(and(<(x,y),<(y,z)),<(x,z))
   //  _ addition __________________________________________________________
   :⇒(<(x,y),<(+(x,z),+(y,z)))
   //  _ multiplication ____________________________________________________
   :⇒(and(<(0,z),<(x,y)),<(⋅(z,x),⋅(z,y)))

   //  Inequality Definitions
   //  _ > __(greater than)_________________________________________________
   :⇔(>(x,y),<(y,x))
   //  _ ≤ _________________________________________________________________
   :⇔(≤(x,y),or(<(x,y),=(x,y)))
   //  _ ≥ _________________________________________________________________
   :⇔(≥(x,y),≤(y,x))
   //  _ positive __________________________________________________________
   :⇔(positive(x),<(0,x))
   //  _ negative __________________________________________________________
   :⇔(negative(x),<(x,0))
   //  _ nonegative ________________________________________________________
   :⇔(nonnegative(x),≤(0,x))

   //  Algebra Definitions and Axioms (Equations)
   //  _ identity ________________________________________________________
   :and(=(+(x,0),x),=(+(0,x),x))
   //  -------------------------------------------------------------------
   :and(=(⋅(1,x),x),=(⋅(x,1),x))
   //  _ commutative __(commutativity)____________________________________
   :=(+(x,y),+(y,x))
   //  -------------------------------------------------------------------
   :=(⋅(x,y),⋅(y,x))
   //  _ associative __(associativity)____________________________________
   :=(+(+(x,y),z),+(x,+(y,z)))
   //  -------------------------------------------------------------------
   :=(⋅(⋅(x,y),z),⋅(x,⋅(y,z)))
   //  _ distributive __(distributivity)__________________________________
   :and(=(⋅(x,+(y,z)),+(⋅(x,y),⋅(x,z))),=(⋅(+(y,z),x),+(⋅(y,x),⋅(z,x))))
   //  _ inverse _________________________________________________________
   :and(=(+(x,-(x)),0),=(+(-(x),x),0))
   //  -------------------------------------------------------------------
   :⇒(invertible(x),and(=(⋅(x,frac(1,x)),1),=(⋅(frac(1,x),x),1)))
   //  _ subtraction _____________________________________________________
   :=(-(x,y),+(x,-(y)))
   //  _ division _____________________________________________________
   :⇒(invertible(y),=(frac(x,y),⋅(x,frac(1,y))))
   //  _ zero __(arithmetic)______________________________________________________
   :and(=(⋅(0,x),0),=(⋅(x,0),0))

   // Number Theory Definitions and Axioms
   // _ induction ________________________________________________________
   // If P[n=0] and ∀k,P[n=k]⇒P[n=k+1] then ∀n,P
   // --------------------------------------------------------------------
   // If P[n=0] and ∀k,(∀j,j≤k⇒P[n=j])⇒P[n=k+1] then ∀n,P
   // --------------------------------------------------------------------
   // If P[n=a] and ∀k,(a≤k and P[n=k])⇒P[n=k+1] then ∀n,a≤n⇒P
   // --------------------------------------------------------------------
   // If P[n=a] and ∀k,( ∀j,(a≤j and j≤k)⇒P[n=j] )⇒P[n=k+1] then ∀n,P
   // _ Division Algorithm _______________________________________________
   :⇒(¬(=(b,0)),∃!(q,∃!(r,and(=(a,+(⋅(q,b),r)),≤(0,r),<(r,abs(b))))))
   // --------------------------------------------------------------------
   // (Note: These two show existence.)
   :⇒(¬(=(b,0)),∃(q,∃(r,and(=(a,+(⋅(q,b),r)),≤(0,r),<(r,abs(b))))))
   :⇒(<(0,b),∃(q,∃(r,and(=(a,+(⋅(q,b),r)),≤(0,r),<(r,b)))))
   // (Note: These two show uniqueness and can also be thought of as mod+
   //and quo+ rules.)
   :⇒(and(¬(=(b,0)),=(a,+(⋅(q,b),r)),≤(0,r),<(r,abs(b))),and(=(q,quo(a,b)),=(r,mod(a,b))))
   :⇒(and(<(0,b),=(a,+(⋅(q,b),r)),≤(0,r),<(r,b)),and(=(q,quo(a,b)),=(r,mod(a,b))))
   // _ quotient (quo) ___________________________________________________
   :⇒(=(q,quo(a,b)),and(¬(=(b,0)),≤(0,-(a,⋅(q,b))),<(-(a,⋅(q,b)),abs(b))))
   :⇒(and(=(q,quo(a,b)),<(b,0)),and(≤(0,-(a,⋅(q,b))),<(-(a,⋅(q,b)),b)))
   // _ remainder (mod) __________________________________________________
   :⇒(=(r,mod(a,b)),and(≤(0,r),<(r,abs(b)),div(b,-(a,r))))
   :⇒(and(=(r,mod(a,b)),<(0,b)),and(≤(0,r),<(r,b),div(b,-(a,r))))
   // _ prime ____________________________________________________________
   :⇒(and(prime(p),div(a,p)),and(<(0,p),or(=(a,1),=(a,p))))
   :⇒(and(<(1,p),∀(a,⇒(and(<(0,a),div(a,p))),or(=(a,1),=(a,p)))),prime(p))
   // _ composite ________________________________________________________
   :⇒(and(<(0,n),div(a,n),<(1,a),<(a,n)),composite(n))
   :⇒(composite(n),and(¬(=(n,0)),∃(a,and(<(1,a),<(a,n),div(a,n)))))
   // _ congruent ________________________________________________________
   :⇔(cong(a,b,m),div(m,-(a,b)))
   // _ gcd ______________________________________________________________
   :⇔(=(d,gcd(a,b)),and(<(0,d),div(d,a),div(d,b),∀(c,⇒(and(div(c,a),div(c,b)),≤(c,d)))))
   :⇒(and(<(0,d),div(d,a),div(d,b),∀(c, ⇒(and(div(c,a),div(c,b)), ≤(c,d)))),=(d,gcd(a,b)))
   // _ lcm ______________________________________________________________
   :⇔(=(d,lcm(a,b)),and(<(0,d),div(a,d),div(b,d),∀(c,⇒(<(0,c),div(a,c),div(b,c)),≤(d,c))))
   :⇒(and(<(0,d),div(a,d),div(b,d),∀(c,and(<(0,c),div(a,c),div(b,c)),≤(d,c))),=(d,lcm(a,b)))
   // _ coprime __________________________________________________________
   :⇔(coprime(a,b),=(gcd(a,b),1))

   // And now we do a bunch of proofs, instantiating the above theorems as needed

      ////////////////////
      // INSTANTIATIONS //
      ////////////////////
      // or+
      :{ :¬(P)
         or(P,¬(P))
       }
      // or+
      :{ :P
         or(P,¬(P))
       }
      // or+
      :{ :P
         or(P,Q)
       }
      // or+
      :{ :Q
         or(P,Q)
       }
      // or+
      :{ :or(P,Q)
         or(or(P,Q),R)
       }
      // or+
      :{ :R
         or(or(P,Q),R)
       }
      // or+
      :{ :P
         or(P,and(¬(P),P))
       }
      // or+
      :{ :¬(P)
         or(¬(P),¬(Q))
       }
      // or+
      :{ :¬(Q)
         or(¬(P),¬(Q))
       }

      // or-
      :{ :or(Q,R)
         :{ :Q or(or(P,Q),R) }
         :{ :R or(or(P,Q),R) }
         or(or(P,Q),R)
       }
      // or-
      :{ :or(P,or(Q,R))
         :{ :P or(or(P,Q),R) }
         :{ :or(Q,R) or(or(P,Q),R) }
         or(or(P,Q),R)
       }
      // or-
      :{ :or(¬(P),¬(Q))
         :{ :¬(P) →← }
         :{ :¬(Q) →← }
         →←
       }

      // →←+
      :{ :or(P,¬(P))
         :¬(or(P,¬(P)))
         →←
       }
      // →←+
      :{ :¬(or(¬(P),¬(Q)))
         :or(¬(P),¬(Q))
         →←
       }
      // →←+
      :{ :¬(and(P,Q))
         :and(P,Q)
         →←
       }
      // →←+
      :{ :¬(P)
         :P
         →←
       }
      // →←+
      :{ :¬(Q)
         :Q
         →←
       }

      // not-
      :{
         :{ :¬(P) →← }
         P
       }
      // not-
      :{
         :{ :¬(Q) →← }
         Q
       }
      // not-
      :{
         :{ :¬(or(P,¬(P))) →← }
         or(P,¬(P))
       }
      // not-
      :{
         :{ :¬(or(¬(P),¬(Q))) →← }
         or(¬(P),¬(Q))
       }

      // not+
      :{
         :{ :and(P,Q) →← }
         ¬(and(P,Q))
       }

      // ⇒+
      :{
         :{ :→← P }
         ⇒(→←,P)
       }
      // ⇒+
      :{
         :{ :or(P,or(Q,R)) or(or(P,Q),R) }
         ⇒(or(P,or(Q,R)),or(or(P,Q),R))
        }
      // ⇒+
      :{
         :{ :P or(P,and(¬(P),P)) }
         ⇒(P,or(P,and(¬(P),P)))
       }
      // ⇒+
      :{
         :{ :or(P,and(¬(P),P)) P }
         ⇒(or(P,and(¬(P),P)),P)
       }
      // ⇒+
      :{
         :{ :P ⇔(P,or(P,and(¬(P),P))) }
         ⇒(P,⇔(P,or(P,and(¬(P),P))))
        }
      // ⇒+
      :{
         :{ :¬(and(P,Q)) or(¬(P),¬(Q)) }
         ⇒(¬(and(P,Q)),or(¬(P),¬(Q)))
        }
      // ⇒+
      :{
         :{ :or(¬(P),¬(Q)) ¬(and(P,Q)) }
         ⇒(or(¬(P),¬(Q)),¬(and(P,Q)))
        }

      // ⇔+
      :{
         :⇒(P,or(P,and(¬(P),P)))
         :⇒(or(P,and(¬(P),P)),P)
         ⇔(P,or(P,and(¬(P),P)))
       }
      // ⇔+
      :{
         :⇒(¬(and(P,Q)),or(¬(P),¬(Q)))
         :⇒(or(¬(P),¬(Q)),¬(and(P,Q)))
         ⇔(¬(and(P,Q)),or(¬(P),¬(Q)))
       }

      // and+
      :{ :P :Q
         and(P,Q)
       }
      // and+
      :{ :P :Q
         and(P,Q)
       }

      // and-
      :{ :and(P,Q)
         P Q
       }

     ////////////////////

  // Theorem 1 (excluded middle): P or not P
  // Proof:
    { :¬(or(P,¬(P)))
      { :¬(P)
      or(P,¬(P))     // by or+
      →←            // by →←+
      }
    P              // by not-
    or(P,¬(P))       // by or+
    →←              // by →←+
    }
  or(P,¬(P))         // by not-
  // ◼

  // Theorem (anything follows from →←): →←⇒P
  // Proof:
    { :→←
      { :¬(P)
      →←         // by copy
      }
      P          // by not-
    }
  ⇒(→←,P)        // by ⇒+
  // ◼

  // Theorem (associativity of 'or'):  P or (Q or R) ⇒ (P or Q) or R
  // Proof:
  { :or(P,or(Q,R))

    { :P
    or(P,Q)                  // by or+
    or(or(P,Q),R)            // by or+
    }

    { :or(Q,R)

      { :Q
      or(P,Q)                // by or+
      or(or(P,Q),R)          // by or+
      }

      { :R
      or(or(P,Q),R)          // by or+
      }

    or(or(P,Q),R)            // by or-
    }
  or(or(P,Q),R)              // by or-
  }

  ⇒(or(P,or(Q,R)),or(or(P,Q),R))  // by ⇒+
  // ◼

  // Theorem (The Most Beautiful Tautology): P ⇒ (P ⇔ P or (¬(P) and P))
  // Proof:
    { :P
      { :P
      or(P,and(¬(P),P))           // by or+
      }
    ⇒(P,or(P,and(¬(P),P)))        // by ⇒+
      { :or(P,and(¬(P),P))
      P                         // by copy
      }
    ⇒(or(P,and(¬(P),P)),P)        // by ⇒+
    ⇔(P,or(P,and(¬(P),P)))        // by ⇔+
    }
  ⇒(P,⇔(P,or(P,and(¬(P),P))))     // by ⇒+
  // ◼

  // Theorem (DeMorgan's Law): ¬(P and Q) ⇔ ¬(P) or ¬(Q)
  // Proof:
    { :¬(and(P,Q))
      { :¬(or(¬(P),¬(Q)))
        { :¬(P)
        or(¬(P),¬(Q))          // by or+
        →←                  // by →←+
        }
      P                    // by not-
        { :¬(Q)
        or(¬(P),¬(Q))          // by or+
        →←                  // by →←+
        }
      Q                    // by not-
      and(P,Q)             // by and+
      →←                    // by →←+
      }
    or(¬(P),¬(Q))              // by not-
    }
  ⇒(¬(and(P,Q)),or(¬(P),¬(Q)))   // by ⇒+
    { :or(¬(P),¬(Q))
      { :and(P,Q)
      P                    // by and-
      Q                    // by and-
        { :¬(P)
        →←                  // by →←+
        }
        { :¬(Q)
        →←                  // by →←+
        }
      →←                    // by or-
      }
    ¬(and(P,Q))              // by not+
    }
  ⇒(or(¬(P),¬(Q)),¬(and(P,Q)))    // by ⇒+
  ⇔(¬(and(P,Q)),or(¬(P),¬(Q)))    // by ⇔+
  // ◼

}`

module.exports.AllofLurchstr = AllofLurchstr
