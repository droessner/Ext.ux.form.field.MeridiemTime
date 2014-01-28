Ext.Loader.setConfig({
        enabled: true,
        paths: {
                'Ext.ux': 'ux'
        }
});

Ext.require('Ext.ux.form.field.MeridiemTime');
Ext.onReady(function() {
	Ext.create('Ext.panel.Panel', {
		title: 'Time Field Demo',
		width: 350,
		renderTo: Ext.getBody(),
		bodyPadding: 5,
		items: [{
			xtype: 'meridiemtime',
			fieldLabel: 'Time'
		}, {
			xtype: 'meridiemtime',
			fieldLabel: 'Time 2',
			value: new Date()
		}, {
			xtype: 'meridiemtime',
			fieldLabel: 'Time 3',
			captureSeconds: true,
			value: new Date()
		}, {
			xtype: 'meridiemtime',
			fieldLabel: 'Time 4',
			width: 300
		}]
	});
});
	