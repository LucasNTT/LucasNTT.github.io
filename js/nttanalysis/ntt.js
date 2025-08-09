//Copyright (C) 2025 Guillaume P. Hérault (https://github.com/LucasNTT/LucasNTT.github.io)
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following condition:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//

importScripts('../../lib/BigInteger/BigInteger.min.js');

// Web Worker that calculates the ntt parameters
onmessage = function(e) {
	ntt.Process(e);
}

function ntt() { };

	ntt.p; 			// our modulus to be analyzed
	ntt.PF;			// all prime factors of (p-1). The elements are bitInt although it is vely unlikely to have huge factors
	ntt.UPF;		// all unique prime factors of (p-1)
	ntt.UPF_exp;	// the exponent of each unique prime factors
	ntt.W;			// primitive (p-1)th root of unity
	ntt.orderTwo;	// multiplicative order of 2 modulo p
	ntt.factorTwo;	// factor of root of two
	ntt.divisorsP1  // divisors of p-1
	ntt.result;

	ntt.Reset = function () {
		ntt.result = '';
	};
	
	ntt.GetPrecedence = function (ch) {
		switch (ch) {
			case '+':
			case '-': return 1;
			case '*': return 2;
			case '^': return 3;
			default: return 0;
		}
	};
	
	ntt.ParseInputParameter = function (inputString) {
		console.log('Entering ParseInputParameter with ' + inputString.data);
		ntt.result = 'Your input parameter is: ' + inputString.data + '<br>';
		
		var input = inputString.data.replace(/\s/g, ''); // remove spaces
		if (input != input.replace(/[^0-9\*+\-\^\(\)]/g,'')) { // check unsupported characters
			ntt.result += 'Syntax Error: unsupported characters!<br><br>';
			ntt.result += 'The allowed characters are:<br>0 1 2 3 4 5 6 7 8 9 + - * ^ ( )<br>';
			return false;
		}

		var savedInput = input;
		// Replace '-2' by '0-2' to be sure that each '+' and '-' are operators and not signs
		if (input.startsWith('-') || input.startsWith('+')) {
			input = '0' + input;
		}
		input = input.split('(-').join('(0-').split('(+').join('(0+');
		console.log('input2 = ' + input);

		if (input != savedInput) {
			ntt.result += 'p = ' + input + '<br>';
		}
		
		// Add missing parenthesis: '1+2*3' is replaced by '1+(2*3)'
		var i = 0;
		while (i < input.length) {
			console.log('i = ' + i);
			console.log('input4 = ' + input);
			var p1 = ntt.GetPrecedence(input.charAt(i));
			if (p1 == 1 || p1 == 2) {
				var j = i + 1;
				var added = false;
				var plevel = 0;
				console.log('input.length = ' + input.length);
				while (j < input.length) {
					var ch = input.charAt(j);
					if (ch == '(') {
						plevel++;
					}
					if (ch == ')') {
						if (plevel > 0) {
							plevel--;
							j++;
							continue;
						}
						else 
							break;
					}
					var p2 = ntt.GetPrecedence(ch);
					if (p2 != 0 && plevel == 0) {
						if (p2 > p1) {
							console.log('p2>p1, added = ' + added);
							if (!added) {
								// insert parenthesis
								input = input.slice(0, i + 1) + '(' + input.slice(i + 1);
								console.log('input( = ' + input);
								i++;
								j++;
								added = true;
								console.log('added !');
							}
						}
						else {
							if (added) {
								input = input.slice(0, j) + ')' + input.slice(j);
								console.log('input) = ' + input);
								i++;
								added = false;
							}
							break;
						}
					}
					j++;
				}
				if (added) {
					input += ')';
				}
			}
			i++;
		}
		console.log('input3 = ' + input);

		// Replace operators by their equivalent in bigInt so that the string can be evaluated
		input = input.split('(').join('bigInt(');
		input = input.split('+').join(').add(');
		input = input.split('-').join(').minus(');
		input = input.split('*').join(').multiply(');
		input = input.split('^').join(').pow(');
		input = 'bigInt(' + input + ')';
		
		// Add quotes around numbers
		input = input.replace(/\(([0-9])/g, '(\'$1').replace(/([0-9])\)/g, '$1\')');
		console.log('input4 = ' + input);
		
		try {
			ntt.p = eval(input);
		} catch (e) {
			console.log(e.message);
			ntt.result += '<br>Syntax Error!<br>';
			ntt.result += 'Please check your input parameter';
			return false;
		}
		
		console.log('p = ' + ntt.p.toString());
		
		if (ntt.p == Infinity || ntt.p == -Infinity) {
			ntt.result += '<br>Infinity Overflow<br>';
			ntt.result += 'Please check your input parameter';
			return false;
		}
		
		ntt.result += 'p = ' + ntt.p.toString().replace(/(.{42})/g,'$1&emsp;<br>') + '<br>';

		if (ntt.p.isNegative()) {
			ntt.result += '<br>Negative modulus are not supported!<br>';
			ntt.result += 'Please check your input parameter';
			return false;
		}
		
		if (ntt.p.lt(9)) {
			ntt.result += '<br>Modulus is too small!<br>';
			ntt.result += 'Please check your input parameter';
			return false;
		}
		
		return true;
	};

	ntt.CheckPrimality = function () {
		console.log('Entering CheckPrimality...');
		var isPrime = ntt.p.isPrime();
		ntt.result += 'Check primality of p : ' + (isPrime? 'passed!' : 'failed!') + '<br>';
		if (!isPrime) {
			ntt.result += 'This modulus is not prime.<br>';
			ntt.result += 'It is not guaranteed that you can find an appropriate root of unity. ';
			ntt.result += 'The existence of the inverse of N is also not guaranteed.<br>';
		}
		return isPrime;
	};
	
	// Method that push a prime factor into PF and UPF arrays
	// Before pushing it in UPF, we check if it's not already in there
	ntt.AddPrimeFactor = function(prime) {
		ntt.PF[ntt.PF.length] = prime; // Push in PF (in Javascript, writing an element at the last position actually appends the element in the array and increments length)
		var pos = ntt.UPF.length;
		for (var i = 0; i < ntt.UPF.length; i++) {
			if (ntt.UPF[i].equals(prime)) {
				pos = i;
				break;
			}
		}
		if (pos < ntt.UPF.length) {
			ntt.UPF_exp[pos] += 1;
		}
		else {
			ntt.UPF[pos] = prime;
			ntt.UPF_exp[pos] = 1;
		}
	};
	
	ntt.GetPrimeFactorsOf = function (x) {
		ntt.PF = [];
		ntt.UPF = [];
		ntt.UPF_exp = [];
		// First get factors of 2 when x is even
		while (x.isEven()) 
        { 
			ntt.AddPrimeFactor(bigInt(2));
			x = x.divide(2);
        }
		// Here x is odd, so we can iterate only on the odd factors starting from 3, two by two
		for (var i = bigInt(3); i.square().lesserOrEquals(x); i = i.add(2)) 
        { 
            // While i divides x, i is a prime factor, divide x and loop 
            while (x.mod(i) == 0) 
            { 
				ntt.AddPrimeFactor(i);
				x = x.divide(i);
            } 
        }
		// This is the last prime factor
		if (x.greater(2)) {
			ntt.AddPrimeFactor(x);
		}	
		for (var i = 0; i < ntt.PF.length; i++) {
			console.log('Prime factor = ' + ntt.PF[i]);
		}
	};
	
	ntt.GetPrimeFactors = function () {
		console.log('Entering GetPrimeFactors...');
		ntt.GetPrimeFactorsOf(ntt.p.minus(1)); // p - 1		
		
		// Print the results
		var s = '';
		for (var i = 0; i < ntt.UPF.length; i++) {
			console.log('Unique prime factor = ' + ntt.UPF[i]);
			if (s != '') s+= ' * ';
			s+= ntt.UPF[i];
			if (ntt.UPF_exp[i] > 1) {
				s+= '^' + ntt.UPF_exp[i];
			}
		}
		ntt.result += 'p - 1 = ' + s + '<br>';
		
		return true;
	};

	// This is algorithm 1 in PDF Lucasntt 
	ntt.GetDeepestRoot = function () {
		console.log('Entering GetDeepestRoot...');
		ntt.W = bigInt(1);
		var Found = false;
		while (!Found) {
			Found = true;
			ntt.W = ntt.W.add(1);
			for (var i = 0; i < ntt.UPF.length; i++) {
				if (ntt.W.modPow(ntt.p.minus(1).divide(ntt.UPF[i]), ntt.p) == 1) {
					Found = false;
					break;
				}
			}
		}
		ntt.result += 'Primitive (p-1)th root of unity = ' + ntt.W + '<br><br>';

		// We focus on the powers of two
		if (ntt.PF.length > 1 && ntt.PF[1] == 2) { // 2^2 minimum
			ntt.result += 'You can perform a NTT of length up to 2^' + ntt.UPF_exp[0] + '<br>';
			ntt.result += 'with a N-th root of unity equals to ' + ntt.W + '^((p-1)/N)<br><br>'
		}
		
		return true;
	};
	
	ntt.GenerateDivisors = function(curIndex, curDivisor) {
		if (curIndex == ntt.UPF.length) {
			ntt.divisorsP1[ntt.divisorsP1.length] = curDivisor;
			return;
		}
		for (var i = 0; i <= ntt.UPF_exp[curIndex]; i++) {
			ntt.GenerateDivisors(curIndex + 1, curDivisor);
			curDivisor = curDivisor.multiply(ntt.UPF[curIndex]);
		}
	};
	
	ntt.GetRootOfTwo = function () {
		console.log('Entering GetRootOfTwo...');

		// Generate all the divisors of (p-1)
		ntt.divisorsP1 = [];
		ntt.GenerateDivisors(0, bigInt(1));
		ntt.divisorsP1.sort(function(a, b){return a-b});
		for (var i = 0; i < ntt.divisorsP1.length; i++) {
			console.log(ntt.divisorsP1[i]);
		}

		// Among these divisors (and starting from the smallest), find the multiplicative order of two in Zp 
		var Found = false;
		for (var i = 0; i < ntt.divisorsP1.length; i++) {
			if (bigInt(2).modPow(ntt.divisorsP1[i], ntt.p) == 1) {
				ntt.orderTwo = ntt.divisorsP1[i];
				Found = true;
				break;
			}
		}
		if (!Found) {
			ntt.result += 'Could not find a proper root of two. IBDWT not possible!';
			return false;
		}
		
		console.log('Order Two = ' + ntt.orderTwo);
		ntt.GetPrimeFactorsOf(ntt.p.minus(1).divide(ntt.orderTwo));
		// We focus also on the powers of two
		if (ntt.PF.length < 2 || ntt.PF[1] != 2) { // 2^2 minimum
			ntt.result += 'The order of two modulo p is too large: ' + ntt.orderTwo.toString() + '<br>';
			ntt.result += 'This prevents from finding a proper root of two.<br>';
			ntt.result += 'IBDWT are not possible with the modulus.';
			return false;
		}

		// Then get the factor regarding the root of one
		Found = false;
		ntt.factorTwo = bigInt(1);
		while (ntt.W.modPow(ntt.p.minus(1).multiply(ntt.factorTwo).divide(ntt.orderTwo), ntt.p) != 2) {
			ntt.factorTwo = ntt.factorTwo.add(2); // only odd numbers
			if (ntt.factorTwo.greater(1000000)) {
				ntt.result += 'Could not find a proper root of two. IBDWT not possible!';
				return false;
			}
		}
		console.log('Factor Two = ' + ntt.factorTwo);
		if (ntt.PF.length > 1 && ntt.PF[1] == 2) { // 2^2 minimum
			ntt.result += 'You can perform a IBDWT of length up to 2^' + ntt.UPF_exp[0] + '<br>';
			ntt.result += 'with a N-th root of two equals to ' + ntt.W + '^(' + ntt.factorTwo + '(p-1)/' + ntt.orderTwo +'N)<br><br>'
			
			// Conclusion
			var bits = bigInt(1);
			while (bigInt(2).pow(bits).minus(1).square().lesser(ntt.p.divide(bigInt(2).pow(bigInt(ntt.UPF_exp[0]).add(1))))) {
				bits = bits.add(1);
			}
			bits = bits.add(-1);
			console.log('bits = ' + bits);
			ntt.result += 'This enables multiplication up to ' + bits.multiply(bigInt(2).pow(bigInt(ntt.UPF_exp[0]))) + ' bits';
		}
		

		return true;
	};
	
	ntt.Process = /*async*/ function (inputString) {
		ntt.Reset();

		// ntt.Process will call all the following functions, in that order
		var functions = [ntt.ParseInputParameter, ntt.CheckPrimality, ntt.GetPrimeFactors, ntt.GetDeepestRoot, ntt.GetRootOfTwo];

		var stepResult;
		for (var i = 0; i < functions.length; i++) {
			stepResult = functions[i](inputString); // call the function
			sleep(500); /*await sleep(500);*/ // wait 500ms in order to get a visual progress of the computation
			postMessage([i, stepResult, ntt.result]); // notify the caller that the function has been computed
			if (!stepResult) {
				console.log('Wrong expected result!');
				return; // stop if one of these functions return false
			}
		}
		return ntt.result;
	};
	
/*
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
*/

// we do not use async / await in order to keep compatibility with Internet Explorer
function sleep(milliSeconds)
{
    var startTime = new Date().getTime(); 
    while (new Date().getTime() < startTime + milliSeconds); // worker thread is frozen during this interval
}
