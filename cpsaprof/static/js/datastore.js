/*global add_events*/

function CPSADataStore() {
    this._store = {
        sql: {},
        request: {}
    };

    this._on_new_record = function(record) {
        // Add calculated fields
        record.duration = record.updated - record.created;
        record.order = null;
        record.relative_created = null;

        if (this._store[record.type][record.id] === undefined) {
            this._add_record(record);
        } else {
            this._update_record(record);
        }
    }.bind(this);

    this._add_record = function(record) {
        // record.order = Object.keys(this._store[record.type]).length + 1;
        this._store[record.type][record.id] = record;
        this.publish('add_' + record.type, record);
        this._update_orders(record.type);
    }.bind(this);

    this._update_record = function(record) {
        // Check this record is newer than the one we currently have
        if (record.updated <= this._store[record.type][record.id].updated) {
            return;
        }
        // record.order = this._store[record.type][record.id].order;
        this._store[record.type][record.id] = record;
        this.publish('update_' + record.type, record);
        this._update_orders(record.type);
    }.bind(this);

    this._update_orders = function(type) {
        // Update the order attibute of all rows
        var records = Object.values(this._store[type]);
        records.sort(function (a, b){
            return a.created - b.created;
        });
        var min_created = records[0].created;
        records.forEach(function(record, index) {
            var order = index + 1,
                relative_created = record.created - min_created;
            if (record.order !== order || record.relative_created !== relative_created) {
                // console.log('Order update', record.order, order);
                record.order = order;
                record.relative_created = relative_created;
                this.publish('update_' + type, record);
            }
        }.bind(this));
    }.bind(this);

    this.listen = function(cpsa_client) {
        cpsa_client.subscribe('new_record', this._on_new_record);
    }.bind(this);

    this.clear = function() {
        Object.keys(this._store).forEach(function(key) {
            this._store[key] = {};
        }.bind(this));
        this.publish('clear');
    }.bind(this);

    this.get = function(type, id) {
        return this._store[type][id];
    }.bind(this);

    this.get_all = function(type) {
        return Object.values(this._store[type]);
    }.bind(this);
}
add_events(CPSADataStore, ['add_sql', 'add_request', 'update_sql', 'update_request', 'clear']);

