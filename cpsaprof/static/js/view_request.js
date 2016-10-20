/*global nice_duration_seconds*/
/*global CPSAViewFactory*/

function CPSAViewRequestSettings() {
    return {
        data: this._datastore.get_all('request'),
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
                title: 'URL',
                data: 'data.request.url'
            }, {
                title: 'Remote IP',
                data: 'data.request.ip'
            }, {
                title: 'Method',
                data: 'data.request.method'
            }, {
                title: 'Size',
                data: 'data.response.body_length'
            }, {
                title: 'Status',
                data: 'data.response.status'
            }
        ]
    };
}
var CPSAViewRequest = CPSAViewFactory('request', CPSAViewRequestSettings);
