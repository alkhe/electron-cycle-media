let pad = (char, n, s) => char.repeat(n - s.length) + s;

export default s => {
	let m = (s / 60) | 0;
	s = s - m * 60;
	let h = (m / 60) | 0;
	m = m - h * 60;

	let str = ':' + pad('0', 2, '' + s);
	return (h > 0
		? h + ':' + pad('0', 2, '' + m)
		: m) + str;
}
