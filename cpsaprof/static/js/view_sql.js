/*global nice_duration_seconds*/
/*global CPSAViewFactory*/

function CPSAViewSqlSettings() {
    return {
        data: this._cpsa_datastore.get_all('sql'),
        rowId: 'id',
        autoWidth: true,
        order: [[0, 'desc']],
        columns: [
            {
                title: 'Index',
                data: 'order'
            }, {
                title: 'Id',
                data: 'id'
            }, {
                title: 'Created',
                data: 'relative_created',
                render: {display: nice_duration_seconds}
            }, {
                title: 'Duration',
                data: 'duration',
                render: {display: nice_duration_seconds}
            }, {
                title: 'Query',
                data: 'data.statement'
            }, {
                title: 'Parameters',
                data: 'data.parameters[, ]'
            }, {
                title: 'Request',
                data: 'data.request_id'
            }
        ]
    };
}
var CPSAViewSql = CPSAViewFactory('sql', CPSAViewSqlSettings);
