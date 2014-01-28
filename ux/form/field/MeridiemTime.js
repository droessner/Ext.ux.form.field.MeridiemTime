/**
 * @class Ext.ux.form.field.MeridiemTime
 * @author Danny Roessner
 * 
 * Custom AM/PM time field.  This will render a textfield
 * and a meridiem dropdown.  The text field will only allow 
 * input of ##:##.  The dropdown has AM and PM in it.
 * only non-military time is allowed in the textfield.
 * Edit checking is done automatically to make sure
 * the time is valid.
 *
 * The field width is calculated automatically if no width
 * is defined to fit the time exactly.
 *
 * Example definition of a meridiem time field:
 *
 *     {
 *         xtype: 'meridiemtime',
 *         fieldLabel: 'Time',
 *         captureSeconds: false
 *     }
 */
Ext.define('Ext.ux.form.field.MeridiemTime', {
	extend: 'Ext.form.field.Picker',
	alias: ['widget.meridiemtime'],
	/**
	 * @cfg {String} format
	 * The default time format string. The format must be valid according to {@link Ext.Date#parse}.
	 * Since the meridiem field is always part of this field, the format must end with 'A'.
	 */
	format: 'h:iA',
	/**
	 * @cfg {Boolean} captureSeconds
	 * Whether or not this time field captures seconds.  If this is set to true, the format used will
	 * default to the catpureSecondsFormat config which defaults to 'h:i:sA'
	 */
	captureSeconds: false,
	/**
	 * @cfg {String} captureSecondsformat
	 * The default time format string if capturing seconds. The format must be valid according to {@link Ext.Date#parse}.
	 * Since the meridiem field is always part of this field, the format must end with 'A'.
	 */
	captureSecondsFormat: 'h:i:sA',
	/**
	 * @cfg {String} meridiemFieldId
	 * This id for the meridiem field will be the id of the time field concatenated with this value.
	 */
	meridiemFieldId: '-meridiem',
	/**
	 * @cfg {String} meridiemFieldWidth
	 * The width of the meridiem field.
	 */
	meridiemFieldWidth: 27,
	/**
	 * @cfg {String} altFormats
	 * Multiple time formats separated by "|" to try when parsing a user input value and it does not match the defined
	 * format.
	 */
	altFormats: 'h:iA|hiA|g:iA|giA|hA|gA',
	/**
	 * @cfg {String} minText
	 * The error text to display when the date in the cell is before {@link #minValue}.
	 */
	minText: "The time in this field must be equal to or after {0}",
	/**
	 * @cfg {String} maxText
	 * The error text to display when the time in the cell is after {@link #maxValue}.
	 */
	maxText: "The time in this field must be equal to or before {0}",
	/**
	 * @cfg {String} invalidText
	 * The error text to display when the time in the field is invalid.
	 */
	invalidText: '{0} is not a valid time - it must be in the format {1}',
	/**
	 * @cfg {String} invalidTextFormat
	 * The time format to display in the invalid text at {1}
	 */
	/**
	 * @cfg {Date/String} minValue
	 * The minimum allowed time. Can be either a Javascript date object or a string date in a valid format.
	 */
	/**
	 * @cfg {Date/String} maxValue
	 * The maximum allowed time. Can be either a Javascript date object or a string date in a valid format.
	 */
	/**
     * @cfg {String} submitFormat
     * The date format string which will be submitted to the server. The format must be valid according to
     * {@link Ext.Date#parse}.
     *
     * Defaults to {@link #format}.
     */
	/**
	 * @cfg {Boolean} selectOnTab
	 * Whether the Tab key should select the currently highlighted item.
	 */
	selectOnTab: true,
	/**
     * @cfg {Number} maxLength
     * Maximum input field length allowed by validation. This behavior is intended to
     * provide instant feedback to the user by improving usability to allow pasting and editing or
	 * overtyping and back tracking.  For this field the maxLength defaults to 5 if captureSeconds
	 * is false and 8 if captureSeconds is true.
	 *
	 * To restrict the maximum number of characters that can be entered into the field use the
     * **{@link Ext.form.field.Text#enforceMaxLength enforceMaxLength}** option.
     */
	/**
     * @cfg {Boolean} enforceMaxLength
     * True to set the maxLength property on the underlying input field. Defaults to true
     */
	enforceMaxLength: true,
	initComponent: function() {
		var me = this,
			isString = Ext.isString,
			minValue,
			maxValue;

		// Fix min/max values if passed in as Strings
		minValue = me.minValue;
		maxValue = me.maxValue;
		if (isString(minValue)) {
			me.minValue = me.parseDate(minValue);
		}
		if (isString(maxValue)) {
			me.maxValue = me.parseDate(maxValue);
		}

		// Update config parameters based on the captureSeconds parameter
		if (me.captureSeconds) {
			me.format = me.captureSecondsFormat;
			me.altFormats = me.altFormats + '|h:i:sA|hi:sA|h:isA|gisA|hisA|g:i:sA|gi:sA|g:isA';
			me.maxLength = 8;
		} else {
			me.maxLength = 5;
		}

		// Meridiem picker defaults
		me.matchFieldWidth = false;
		me.pickerAlign = 'tr-br?';

		// Always enable key events to listen for the tab key
		me.enableKeyEvents = true;

		// Set up default values if none specified
		Ext.applyIf(me, {
			invalidTextFormat: me.captureSeconds ? 'HH:MM:SS AM/PM' : 'HH:MM AM/PM',
			width: (me.captureSeconds ? 80 : 63) + me.meridiemFieldWidth + (me.fieldLabel ? (me.labelWidth || 100) : 0)
		});

		me.callParent(arguments);
	},
	initValue: function() {
		var me = this,
			value = me.value;

		if (Ext.isString(value)) {
			me.value = me.rawToValue(value);
		}

		me.callParent();
	},
	/**
     * Clears out the date values and seconds if capture seconds is false.
	 *
     * @protected
     * @param {Object} value The initial value
     * @return {Object} The modified initial value
     */
    transformOriginalValue: function(value) {
		return this.clearDate(value);
	},
	initEvents: function() {
		var me = this;

		me.callParent();

		// Add focus and blur events so that we can add/remove the focus class to the meridiem field
		me.on({
			focus: me.onFieldFocus,
			blur: me.onFieldBlur
		});

		// Add a click listener to the meridiem field to expand the dropdown
		me.mon(me.getMeridiemField(), 'click', me.onMeridiemClick, me);
	},
	/**
	 * Sets a data value into the field and runs the change detection and validation. Also applies any configured
	 * {@link #emptyText} for text fields. To set the value directly without these inspections see {@link #setRawValue}.
	 * @param {Object} value The value to set
	 * @return {Ext.form.field.Text} this
	 */
	setValue: function(value) {
		var me = this,
			rawValue = me.valueToRaw(value),
			time,
			meridiem;

		if (Ext.isString(rawValue)) {
			time = rawValue.replace(/(AM|PM)$/i, '');
			meridiem = rawValue.substring(rawValue.length - 2);
		}

		me.setRawValue(time);
		me.mixins.field.setValue.call(me, time);
		if (meridiem) {
			me.setMeridiemValue(meridiem);
		}

		// If no date specified, default the meridiem value based on the current system time
		if (!me.meridiemValue) {
			me.meridiemValue = new Date().getHours() >= 12 ? 'PM' : 'AM';
		}

		return me;
	},
	/**
	 * @private
	 */
	getSubmitValue: function() {
        var format = this.submitFormat || this.format,
            value = this.getValue();

        return value ? Ext.Date.format(value, format) : '';
    },
	/**
	 * @private
	 */
	setMeridiemValue: function(value) {
		var me = this,
			field = me.getMeridiemField();

		me.meridiemValue = value;

		if (field) {
			field.update(value);
		}
	},
	/**
	 * @private
	 */
	getMeridiemField: function() {
		var field;

		if (this.meridiemField) {
			field = this.meridiemField;
		} else {
			field = this.meridiemField = Ext.get(this.id + this.meridiemFieldId);
		}
		return field;
	},
	/**
	 * Replaces any existing {@link #minValue} with the new value and refreshes the am/pm picker.
	 * @param {Date} value The minimum time that can be selected
	 */
	setMinValue: function(value) {
		this.minValue = (Ext.isString(value) ? this.parseDate(value) : value);
	},
	/**
	 * Replaces any existing {@link #maxValue} with the new value and refreshes the am/pm picker.
	 * @param {Date} value The maximum time that can be selected
	 */
	setMaxValue: function(value) {
		this.maxValue = (Ext.isString(value) ? this.parseDate(value) : value);
	},
	/**
	 * Runs all of time validations and returns an array of any errors. Note that this first runs text validations,
	 * so the returned array is an amalgamation of all field errors. The additional validation checks are testing that
	 * the date format is valid, that the chosen time is within the min and max time constraints set.
	 * @param {Object} [value] The value to get errors for (defaults to the current field value)
	 * @return {String[]} All validation errors for this field
	 */
	getErrors: function(value) {
		var me = this,
			format = Ext.String.format,
			formattedValue,
			errors = me.callParent(arguments),
			minValue = me.minValue,
			maxValue = me.maxValue,
			parsedValue,
			time;

		formattedValue = me.formatDate(value || me.processRawValue(me.getRawValue()));

		if (formattedValue === null || formattedValue.length < 1) {
			return errors;
		}

		parsedValue = me.parseDate(formattedValue);
		if (!parsedValue) {
			errors.push(format(me.invalidText, formattedValue + ' ' + me.meridiemValue, me.invalidTextFormat));
			return errors;
		}

		time = parsedValue.getTime();
		if (minValue && time < minValue.getTime()) {
			errors.push(format(me.minText, me.formatDate(minValue)));
		}

		if (maxValue && time > maxValue.getTime()) {
			errors.push(format(me.maxText, me.formatDate(maxValue)));
		}

		return errors;
	},
	rawToValue: function(rawValue) {
		return this.parseDate(rawValue) || rawValue || null;
	},
	valueToRaw: function(value) {
		return this.formatDate(this.parseDate(value));
	},
	/**
	 * Attempts to parse a given string value using a given {@link Ext.Date#parse date format}.
	 * @param {String} value The value to attempt to parse
	 * @param {String} format A valid date format (see {@link Ext.Date#parse})
	 * @return {Date} The parsed Date object, or null if the value could not be successfully parsed.
	 */
	safeParse: function(value, format) {
		var parsedDate = Ext.Date.parse(value, format, this.useStrict);

		return parsedDate ? this.clearDate(parsedDate) : null;
	},
	/**
	 * @private
	 */
	parseDate: function(value) {
		var me,
			meridiem,
			parsedValue,
			altFormats,
			altFormatsArray,
			length,
			i;


		if (!value || Ext.isDate(value)) {
			parsedValue = value;
		} else {
			me = this;
			meridiem = me.meridiemValue;
			parsedValue = me.safeParse(value + meridiem, me.format);
			altFormats = me.altFormats;
			altFormatsArray = me.altFormatsArray;

			if (!parsedValue && altFormats) {
				altFormatsArray = altFormatsArray || altFormats.split('|');
				length = altFormatsArray.length;
				for (i = 0; i < length && !parsedValue; ++i) {
					parsedValue = me.safeParse(value + meridiem, altFormatsArray[i]);
				}
			}
		}

		return parsedValue;
	},
	/**
	 * @private
	 */
	formatDate: function(date) {
		return Ext.isDate(date) ? Ext.Date.dateFormat(date, this.format) : date;
	},
	createPicker: function() {
		var me = this,
			picker,
			pickerCfg = Ext.apply({
				xtype: 'boundlist',
				pickerField: me,
				selModel: {
					mode: 'SINGLE'
				},
				floating: true,
				hidden: true,
				focusOnToFront: false,
				displayField: 'code',
				width: me.meridiemFieldWidth + 18,
				listeners: {
					select: me.onSelect,
					scope: me
				},
				store: Ext.create('Ext.data.Store', {
					autoDestroy: true,
					fields: ['code'],
					data: [{
						code: 'AM'
					}, {
						code: 'PM'
					}],
					proxy: {
						type: 'memory'
					}
				})
			}, me.listConfig, me.defaultListConfig);

		picker = me.picker = Ext.widget(pickerCfg);

		return picker;
	},
	/**
     * If the passed in value is a date, resets the month/day/year values to the current date and clears the seoncds
	 * if the catpureSeconds config is set to false.
     *
     * @param {Date} date The date
     * @return {Date} The date with the day/month/year cleared out.
     */
    clearDate: function(date) {
        var me = this,
			today;

		if (Ext.isDate(date)) {
			today = new Date();

			date.setDate(today.getDate());
			date.setMonth(today.getMonth());
			date.setFullYear(today.getFullYear());

			if (!me.captureSeconds) {
				date.setSeconds(0);
			}
		}

		return date;
    },
	getTriggerMarkup: function() {
		var me = this,
			prefix = Ext.baseCSSPrefix;

		return Ext.DomHelper.markup([{
			tag: 'td',
			role: 'presentation',
			valign: 'top',
			style: 'width: ' + me.meridiemFieldWidth + 'px',
			cn: {
				id: me.id + me.meridiemFieldId,
				cls: prefix + 'trigger-index-0 ' + prefix + 'form-text ' + prefix + 'form-field',
				style: 'border-left-width: 0px',
				role: 'presentation',
				html: me.meridiemValue
			}
		}, {
			tag: 'td',
			role: 'presentation',
			valign: 'top',
			cls: prefix + 'trigger-cell ' + Ext.dom.Element.unselectableCls,
			style: 'width:' + me.triggerWidth + 'px;' + (me.readOnly ? 'display:none;' : ''),
			cn: {
				cls: [prefix + 'trigger-index-1', me.triggerBaseCls].join(' '),
				role: 'presentation'
			}
		}]);
	},
	onEnable: function() {
		var me = this;

		me.callParent();
		me.getMeridiemField().setStyle('background', '');
	},
	onDisable: function() {
		var me = this;

		me.callParent();
		me.getMeridiemField().setStyle('background', '#DDDDDD');
	},
	onSelect: function(selectionModel, record) {
		var me = this,
			meridiem = record.get('code'),
			value = me.getValue(),
			newValue;

		me.setMeridiemValue(meridiem);
		if (value) {
			newValue = Ext.Date.parse(Ext.Date.format(value, 'his') + meridiem, 'hisA');
			me.setValue(newValue);
			me.fireEvent('select', me, newValue);
		}

		me.collapse();
	},
	/**
	 * @private
	 * Enables the key nav for the BoundList when it is expanded.
	 */
	onExpand: function() {
		var me = this,
			keyNav = me.listKeyNav,
			selectOnTab = me.selectOnTab,
			value = me.getValue(),
			picker = me.getPicker(),
			record;

		if (Ext.isDate(value)) {
			record = picker.getStore().getAt(Ext.Date.format(value, 'A') === 'AM' ? 0 : 1);
			picker.select(record, false, true);
		} else {
			record = picker.getStore().getAt(me.meridiemValue === 'AM' ? 0 : 1);
		}

		picker.highlightItem(picker.getNodeByRecord(record));

		if (keyNav) {
			keyNav.enable();
		} else {
			keyNav = me.listKeyNav = new Ext.view.BoundListKeyNav(me.inputEl, {
				boundList: picker,
				forceKeyDown: true,
				tab: function(e) {
					if (selectOnTab) {
						this.selectHighlighted(e);
						me.triggerBlur();
						me.collapse();
					}

					return true;
				},
				enter: function(e) {
					var selModel = picker.getSelectionModel(),
						count = selModel.getCount();

					this.selectHighlighted(e);

					// Handle the case where the highlighted item is already selected
					// In this case, the change event won't fire, so just collapse
					if (!me.multiSelect && count === selModel.getCount()) {
						me.collapse();
					}
				}
			});
		}

		// While list is expanded, stop tab monitoring from Ext.form.field.Trigger so it doesn't short-circuit selectOnTab
		if (selectOnTab) {
			me.ignoreMonitorTab = true;
		}

		Ext.defer(keyNav.enable, 1, keyNav); //wait a bit so it doesn't react to the down arrow opening the picker
		me.inputEl.focus();
	},
	/**
	 * @private
	 * Disables the key nav for the BoundList when it is collapsed.
	 */
	onCollapse: function() {
		var me = this,
			keyNav = me.listKeyNav;

		if (keyNav) {
			keyNav.disable();
			me.ignoreMonitorTab = false;
		}
	},
	/**
	 * @private
	 */
	onKeyDown: function(event) {
		var me = this,
			key = event.getKey(),
			picker,
			expanded;

		// When pressing the tab key from the input field, if the picker is not expanded, expand the
		// picker instead of tabbing to the next field.
		if (!me.readOnly && !me.disabled && me.editable && key === event.TAB && !event.shiftKey) {
			picker = this.getPicker();
			expanded = me.isExpanded;

			if (!expanded || !picker.isVisible()) {
				event.stopEvent();

				if (expanded) {
					me.collapse();
				}
				me.expand();
			}
		}

		me.fireEvent('keydown', me, event);
	},
	/**
	 * @private
	 */
	onFieldFocus: function() {
        var me = this,
            focusCls = me.focusCls,
            meridiemEl = me.getMeridiemField();

		// Add the focus class to the meridiem field
		if (focusCls && meridiemEl) {
			meridiemEl.addCls(Ext.baseCSSPrefix + focusCls);
		}
    },
	/**
	 * @private
	 */
	onFieldBlur: function() {
        var me = this,
            focusCls = me.focusCls,
            meridiemEl = me.getMeridiemField();

		// Remove the focus class from the meridiem field
		if (focusCls && meridiemEl) {
            meridiemEl.removeCls(Ext.baseCSSPrefix + focusCls);
        }
    },
	/**
	 * @private
	 */
	beforeBlur: function() {
		var me = this,
			value = me.parseDate(me.getRawValue()),
			focusTask = me.focusTask;

		if (focusTask) {
			focusTask.cancel();
		}

		if (value) {
			me.setValue(value);
		}
	},
	/**
	 * @private
	 */
	onMeridiemClick: function() {
		var me = this;

		if (!me.disabled && !me.readOnly) {
			me.expand();
		}
	},
	/**
	 * @private
	 */
	onDestroy: function() {
		var me = this;

		if (me.listKeyNav) {
			Ext.destroy(me.listKeyNav);
		}

		me.callParent();
	}
});