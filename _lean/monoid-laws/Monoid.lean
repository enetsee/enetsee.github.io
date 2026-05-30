/-! # The monoid laws for `Nat`, proved in Lean

The proofs below are processed by LeanInk + Alectryon, so each tactic step
shows the intermediate proof state when you hover or step through it. -/

/- Associativity of addition. We go by induction on the last argument. -/
theorem nat_add_assoc (a b c : Nat) : (a + b) + c = a + (b + c) := by
  induction c with
  | zero => rfl
  | succ c ih => simp [Nat.add_succ, ih]

/- `0` is a left identity. (It is a right identity definitionally.) -/
theorem nat_zero_add (a : Nat) : 0 + a = a := by
  induction a with
  | zero => rfl
  | succ a ih => simp [Nat.add_succ, ih]
