/*global $*/
/*global CPSAClient*/
/*global CPSADataStore*/
/*global CPSASqlView*/
/*global CPSARequestView*/

var cpsa_client = new CPSAClient(),
    cpsa_datastore = new CPSADataStore(),
    // cpsa_sql_aggregator = new CPSASqlAggregator(),
    cpsa_sql_view = new CPSASqlView(),
    cpsa_request_view = new CPSARequestView();

cpsa_datastore.listen(cpsa_client);
// cpsa_sql_aggregator.listen(cpsa_datastore);
cpsa_sql_view.listen(cpsa_datastore);
cpsa_request_view.listen(cpsa_datastore);

$(function() {
    $('#start').click(cpsa_client.start);
    $('#stop').click(cpsa_client.stop);
    $('#clear').click(cpsa_datastore.clear);

    cpsa_client.subscribe('start', function() {
        $('#start').prop("disabled", true);
        $('#stop').prop("disabled", false);
    });

    cpsa_client.subscribe('stop', function() {
        $('#start').prop("disabled", false);
        $('#stop').prop("disabled", true);
    });

    cpsa_datastore.subscribe('clear', function() {
        $('#clear').prop("disabled", true);
    });

    cpsa_datastore.subscribe('add_sql', function(data) {
        $('#clear').prop("disabled", false);
    });

    cpsa_datastore.subscribe('add_request', function(data) {
        $('#clear').prop("disabled", false);
    });

    // VIEWS

    $('#view_sql').click(show_view.bind(this, cpsa_sql_view));
    $('#view_request').click(show_view.bind(this, cpsa_request_view));

    var _current_view;
    function show_view(view) {
        // If the view is already displayed, do nothing
        if (_current_view == view) return;

        if (_current_view !== undefined) {
            _current_view.remove();
        }
        view.display($('#container'));
        _current_view = view;
    }

    show_view(cpsa_sql_view);
});
