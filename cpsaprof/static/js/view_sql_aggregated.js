/*global nice_duration_seconds*/
/*global CPSAViewFactory*/

function CPSAViewSqlAggregatedSettings() {
    return {
        data: this._datastore.get_all(),
        rowId: 'id',
        autoWidth: true,
        order: [[0, 'desc']],
        columns: [
            {
            //     title: 'Index',
            //     data: 'order'
            // }, {
                title: 'Id',
                data: 'id'
            }, {
                title: 'Statement',
                data: 'statement'
            }, {
                title: 'Total Duration',
                data: 'total_duration',
                render: {display: nice_duration_seconds}
            }, {
                title: 'SQL Count',
                data: 'sql_count'
            }, {
                title: 'Per SQL Duration',
                data: 'duration_per_sql',
                render: {display: nice_duration_seconds}
            }, {
                title: 'Request Count',
                data: 'request_count'
            }, {
                title: 'Per Request Duration',
                data: 'duration_per_request',
                render: {display: nice_duration_seconds}
            }
        ]
    };
}
var CPSAViewSqlAggregated = CPSAViewFactory('agg_sql', CPSAViewSqlAggregatedSettings);
