define([
	"./core",
	"./var/rnotwhite",
	"./core/access",
	"./data/var/dataPriv",
	"./data/var/dataUser"
], function( jQuery, rnotwhite, access, dataPriv, dataUser ) {

//	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /([A-Z])/g;

// 用于设置 HTML5 data-* 属性到cache中，并返回 属性值
function dataAttr( elem, key, data ) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	// 如果在cache没有找到数据，
    // 尝试从  HTML5 data-* 属性中 查找

    // data 如果为空 且  元素类型为 节点
	if ( data === undefined && elem.nodeType === 1 ) {
        // 将 key 转换成 HTML5 data-* 属性
        // addName => data-add-name
		name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();
        // 获取属性值
		data = elem.getAttribute( name );

        // 如果 数据的类型为 string, 说明有其属性
		if ( typeof data === "string" ) {
			try {
                // 尝试转换属性值
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
                    // 如果不会更改字符串，只转换为数字
					+data + "" === data ? +data :
                    // rbrace 测试是否为 json 字符串，jQuery.parseJSON 来解析成 json
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
                    // 否则当是普通的字符串
					data;
			} catch ( e ) {}

			// Make sure we set the data so it isn't changed later
            // 确定我们set data, 所以之后不会改变
            // "<div data-aaa='abc'></div>"
            // $($0).data('aaa')  => 'abc'
            // $($0).attr('data-aaa','xxx')
            // $($0).data('aaa')  => 'abc'
			dataUser.set( elem, key, data );

        //否则 undefined
		} else {
			data = undefined;
		}
	}
    // 返回数据
	return data;
}

jQuery.extend({
    // 判断是有 data
	hasData: function( elem ) {
        // 从来 User 中判断，如果没有则在 Priv 中判断
		return dataUser.hasData( elem ) || dataPriv.hasData( elem );
	},

    // 设置或者获取 data
	data: function( elem, name, data ) {
        //
		return dataUser.access( elem, name, data );
	},

    // 删除 data
	removeData: function( elem, name ) {
        // 从 User 中删除
		dataUser.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to dataPriv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return dataPriv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		dataPriv.remove( elem, name );
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var i, name, data,
			elem = this[ 0 ],
			attrs = elem && elem.attributes;
		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = dataUser.get( elem );

				if ( elem.nodeType === 1 && !dataPriv.get( elem, "hasDataAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {

						// Support: IE11+
						// The attrs elements can be null (#14894)
						if ( attrs[ i ] ) {
							name = attrs[ i ].name;
							if ( name.indexOf( "data-" ) === 0 ) {
								name = jQuery.camelCase( name.slice(5) );
								dataAttr( elem, name, data[ name ] );
							}
						}
					}
					dataPriv.set( elem, "hasDataAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				dataUser.set( this, key );
			});
		}

		return access( this, function( value ) {
			var data,
				camelKey = jQuery.camelCase( key );

			// The calling jQuery object (element matches) is not empty
			// (and therefore has an element appears at this[ 0 ]) and the
			// `value` parameter was not undefined. An empty jQuery object
			// will result in `undefined` for elem = this[ 0 ] which will
			// throw an exception if an attempt to read a data cache is made.
			if ( elem && value === undefined ) {
				// Attempt to get data from the cache
				// with the key as-is
				data = dataUser.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to get data from the cache
				// with the key camelized
				data = dataUser.get( elem, camelKey );
				if ( data !== undefined ) {
					return data;
				}

				// Attempt to "discover" the data in
				// HTML5 custom data-* attrs
				data = dataAttr( elem, camelKey, undefined );
				if ( data !== undefined ) {
					return data;
				}

				// We tried really hard, but the data doesn't exist.
				return;
			}

			// Set the data...
			this.each(function() {
				// First, attempt to store a copy or reference of any
				// data that might've been store with a camelCased key.
				var data = dataUser.get( this, camelKey );

				// For HTML5 data-* attribute interop, we have to
				// store property names with dashes in a camelCase form.
				// This might not apply to all properties...*
				dataUser.set( this, camelKey, value );

				// *... In the case of properties that might _actually_
				// have dashes, we need to also store a copy of that
				// unchanged property.
				if ( key.indexOf("-") !== -1 && data !== undefined ) {
					dataUser.set( this, key, value );
				}
			});
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each(function() {
			dataUser.remove( this, key );
		});
	}
});

return jQuery;
});
