/*global add_events*/
/*global generate_id*/

function CPSAAggregatorSql() {
    this._store = {};
    this._aggregated_sql_ids = {};

    this._on_add_or_update_sql = function(record) {
        // Only add records when they are complete i.e. when updated > created
        if (this._should_aggregate_record(record)) {
            // Add this record to our aggregated store now
            this._aggregate_record(record.id, record.data.statement, record.data.request_id, record.duration);
        }
    }.bind(this);

    this._should_aggregate_record = function(record) {
        if (record.duration === 0) {
            // Doesn't look like this record is finished yet
            // console.log('Unfinished SQL record ignored:', record.id);
            return false;
        }

        if (this._aggregated_sql_ids[record.id] !== undefined) {
            // Looks like this record has already been aggregated
            // console.log('Updated SQL record has already been aggregated:', record.id);
            return false;
        }

        // console.log('Aggregating SQL record:', record.id);
        return true;
    }.bind(this);

    this._aggregate_record = function(sql_id, statement, request_id, duration) {
        this._aggregated_sql_ids[sql_id] = true;
        var agg_record = this._add_or_retrieve_agg_record(statement);
        this._update_agg_record(agg_record, sql_id, request_id, duration);
    }.bind(this);

    this._add_or_retrieve_agg_record = function(statement) {
        var id = generate_id(statement);
        if (this._store[id] === undefined) {
            this._store[id] = {
                id: id,
                statement: statement,
                total_duration: 0,
                sql_ids: {},
                sql_count: 0,
                duration_per_sql: 0,
                request_ids: {},
                request_count: 0,
                duration_per_request: 0
            };
            this.publish('add_agg_sql', this._store[id]);
        }
        return this._store[id];
    }.bind(this);

    this._update_agg_record = function(agg_record, sql_id, request_id, duration) {
        agg_record.total_duration += duration;

        agg_record.sql_ids[sql_id] = true;
        agg_record.sql_count = Object.keys(agg_record.sql_ids).length;
        agg_record.duration_per_sql = agg_record.total_duration / agg_record.sql_count;

        agg_record.request_ids[request_id] = true;
        agg_record.request_count = Object.keys(agg_record.request_ids).length;
        agg_record.duration_per_request = agg_record.total_duration / agg_record.request_count;
        this.publish('update_agg_sql', agg_record);
    }.bind(this);

    this._on_clear = function() {
        this._store = {};
        this._aggregated_sql_ids = {};
        this.publish('clear');
    }.bind(this);

    this.listen = function(cpsa_datastore) {
        cpsa_datastore.subscribe('add_sql', this._on_add_or_update_sql);
        cpsa_datastore.subscribe('update_sql', this._on_add_or_update_sql);
        cpsa_datastore.subscribe('clear', this._on_clear);
    }.bind(this);

    this.get = function(id) {
        return this._store[id];
    }.bind(this);

    this.get_all = function() {
        return Object.values(this._store);
    }.bind(this);
}
add_events(CPSAAggregatorSql, ['add_agg_sql', 'update_agg_sql', 'clear']);
