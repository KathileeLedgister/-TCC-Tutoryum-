// Overwrite NIST-P256 with secp256k1
sjcl.ecc.curves.c256 = new sjcl.ecc.curve(
	sjcl.bn.pseudoMersennePrime(256, [[0, -1], [4, -1], [6, -1], [7, -1], [8, -1], [9, -1], [32, -1]]),
	"0x14551231950b75fc4402da1722fc9baee",
	0,
	7,
	"0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
	"0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
);

// Replace point addition and doubling algorithms
// NIST-P256 is a=-3, we need algorithms for a=0
sjcl.ecc.pointJac.prototype.add = function(T) {
	var S = this;
	if (S.curve !== T.curve) {
		throw ("sjcl.ecc.add(): Points must be on the same curve to add them!");
	}

	if (S.isIdentity) {
		return T.toJac();
	} else if (T.isIdentity) {
		return S;
	}

	var z1z1 = S.z.square(),
		h = T.x.mul(z1z1).sub(S.x),
		s2 = T.y.mul(S.z).mul(z1z1);

	if (h.equals(0)) {
		if (S.y.equals(T.y.mul(z1z1.mul(S.z)))) {
			// same point
			return S.doubl();
		} else {
			// inverses
			return new sjcl.ecc.pointJac(S.curve);
		}
	}

	var hh = h.square(),
		i = hh.mul(4),
		j = h.mul(i),
		r = s2.sub(S.y).mul(2),
		v = S.x.mul(i),
		x = r.square().sub(j).sub(v.mul(2)),
		y = r.mul(v.sub(x)).sub(S.y.mul(j).mul(2)),
		z = S.z.add(h).square().sub(z1z1).sub(hh);

	return new sjcl.ecc.pointJac(this.curve, x, y, z);
};

sjcl.ecc.pointJac.prototype.doubl = function() {
	if (this.isIdentity) { return this; }

	var a = this.x.square(),
		b = this.y.square(),
		c = b.square(),
		d = this.x.add(b).square().sub(a).sub(c).mul(2),
		e = a.mul(3),
		f = e.square(),
		x = f.sub(d.mul(2)),
		y = e.mul(d.sub(x)).sub(c.mul(8)),
		z = this.y.mul(this.z).mul(2);
	return new sjcl.ecc.pointJac(this.curve, x, y, z);
};

sjcl.ecc.ecdsa.secretKey.prototype = {
	sign: function(hash, paranoia) {
		var R = this._curve.r,
			l = R.bitLength(),
			k = sjcl.bn.random(R.sub(1), paranoia).add(1),
			r = this._curve.G.mult(k).x.mod(R),
			s = k.inverseMod(R).mul(sjcl.bn.fromBits(hash).add(r.mul(this._exponent))).mod(R);
		return sjcl.bitArray.concat(r.toBits(l), s.toBits(l));
	}
};

sjcl.ecc.ecdsa.publicKey.prototype = {
	verify: function(hash, rs) {
		var w = sjcl.bitArray,
			R = this._curve.r,
			l = R.bitLength(),
			r = sjcl.bn.fromBits(w.bitSlice(rs, 0, l)),
			s = sjcl.bn.fromBits(w.bitSlice(rs, l, 2 * l)),
			c = s.inverseMod(R),
			hG = sjcl.bn.fromBits(hash).mul(c).mod(R),
			hA = r.mul(c).mod(R),
			r2 = this._curve.G.mult2(hG, hA, this._point).x;

		if (r.equals(0) || s.equals(0) || r.greaterEquals(R) || s.greaterEquals(R) || !r2.equals(r)) {
			throw (new sjcl.exception.corrupt("signature didn't check out"));
		}
		return true;
	}
};

