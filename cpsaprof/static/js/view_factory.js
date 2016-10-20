
function CPSAViewFactory(type, settings_function) {
    return function() {
        this._container = undefined;
        this._datatable = undefined;

        this.listen = function(datastore) {
            this._datastore = datastore;
            datastore.subscribe('add_' + type, this._on_add_data);
            datastore.subscribe('update_' + type, this._on_update_data);
            datastore.subscribe('clear', this._on_clear);
        }.bind(this);

        this._on_add_data = function(data) {
            if (this._datatable === undefined) return;
            this._datatable.row.add(data);
            this._datatable.draw();
            this._datatable.columns.adjust();
        }.bind(this);

        this._on_update_data = function(data) {
            if (this._datatable === undefined) return;
            this._datatable.row('#' + data.id).data(data);
            this._datatable.draw();
            this._datatable.columns.adjust();
        }.bind(this);

        this._on_clear = function() {
            if (this._datatable === undefined) return;
            this._datatable.clear();
            this._datatable.draw();
            this._datatable.columns.adjust();
        }.bind(this);

        this.display = function(container, search) {
            if (this._datatable !== undefined) {
                console.log('Tried to display CPSAView when it is already displayed!');
                return;
            }
            this._container = container;
            this._datatable = container.DataTable(settings_function.call(this));
            if (search) {
                this._datatable.search(search);
                this._datatable.draw();
            }
        }.bind(this);

        this.remove = function() {
            if (this._datatable === undefined) {
                console.log('Tried to remove CPSAView when it has not been displayed!');
                return;
            }
            this._datatable.destroy();
            this._container.empty();
            this._datatable = undefined;
            this._container = undefined;
        }.bind(this);
    };
}
