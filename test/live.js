LE.log( '--- Start');
LE.log( 'Simple message');

LE.log( 'Multiple messages', 'Second message', 'Third message');

/*
Logging flat objects.

Flat objects are serialized in the form of field=value.
*/
LE.log( {
	event: 'Logging JS object',
	integer_field: 100,
	float_field: 3.14,
	string_field: 'some text'
});

/*
Logging combined messages.
*/
LE.log( 'jserror', {
	first: 'a',
	second: 'b'
});

/*
Logging objects with complex fields.

Sub-fields are encoded in the form of field.subfield
Arrays are encoded in the form of field.0, field.1, etc.
*/
LE.log( {
	event: 'More advanced logging',
	array_field: ['string', 10, 2.56],
	complex_field: {
		sub_element: 'first',
		sub_element2: 'second'
	}
});

/*
Values must be properly escaped.
*/
LE.log( {
	event: 'Escaping "test" \'test\' \\ !@#$%^*()',
});
LE.log( '--- Last but one');

/*
Null values must not crash the lib.
*/
LE.log( null);
LE.log( undefined);
LE.log( 'This is null', null);
LE.log( 'This is undefined', undefined);
LE.log( {
	event: 'With null and undefined values',
	is_null: null,
	is_undef: undefined,
	complex: {
		event: 'Sub fields',
		sub_null: null,
		sub_undef: undefined
	}
});

/*
Error logging
*/
var a = 1, b = 0;
var c = a/d;

LE.log( '--- End');

/*
Test different log levels
*/
LE.warn("A warning message");
LE.error("An error message");
LE.info("An info message");
