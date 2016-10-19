/*global add_events*/

function CPSASqlAggregator() {
    this._store = {};
    this._aggregated_ids = {};

    this.listen = function(cpsa_datastore) {
        cpsa_datastore.subscribe('add_sql', this._on_add_or_update_sql);
        cpsa_datastore.subscribe('update_sql', this._on_add_or_update_sql);
        cpsa_datastore.subscribe('clear', this._on_clear);
    }.bind(this);

    this._on_add_or_update_sql = function(record) {
        // Only add records when they are complete i.e. when updated > created
        if (record.duration === 0) {
            if (this._aggregated_ids[record.id] !== undefined) {
                console.log('Updated SQL record has already been aggregated:', record);
            } else {
                // Add this record to our aggregated store now
                console.log('Aggregating SQL record:', record);
                this._aggregated_ids[record.id] = true;
                // TODO: Aggregate record
            }
        } else {
            console.log('Unfinished SQL record ignored:', record);
        }
    }.bind(this);

    this._on_clear = function() {
        this._store = {};
        this.publish('clear');
    }.bind(this);
}
add_events(CPSASqlAggregator, ['add', 'update', 'clear']);
