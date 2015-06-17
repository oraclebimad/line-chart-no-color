{
  id: '03efcb62a28c.LineChart',
  component: {
    'name': 'Line Bar Chart',
    'tooltip': 'Insert Line Bar Chart',
    'cssClass': 'line-chart-plugin'
  },
  properties: [
    {key: "width", label: "Width", type: "length", value: "1024px"},
    {key: "height", label: "Height", type: "length", value: "300px"},
    {key: "linecolor", label: "Line Color", type: "color", value: '#46b319'},
    {key: "background", label: "Background Color", type: "color", value: '#fff'}
  ],
  remoteFiles: [
    {
      type:'js',
      location: 'asset://js/LineChart.concat.js',
      isLoaded: function() {
        return 'Visualizations' in window && 'LineChart' in Visualizations;
      }
    },
    {
      type:'css',
      location:'asset://css/style.css'
    }
  ],
  fields: [
    {name: "group", caption: "Drop Main Group Field Here", fieldType: "label", dataType: "string"},
    {name: "subgroup", caption: "Drop Subgroup Field Here", fieldType: "label", dataType: "string"},
    {name: "size", caption: "Drop Size Field Here", fieldType: "measure", dataType: "number", formula: "summation"}
  ],
  dataType: 'arrayOfArrays',
  avoidRefresh: false,
  getColorScheme: function (props) {
    return [props.linecolor];
  },
  render: function (context, container, data, fields, props) {
    container.innerHTML = '';
    this.dataModel = new Utils.DataModel(data, fields);
    this.dataModel.indexColumns().setColumnOrder(['group', 'subgroup', 'size']);
    var indexedFields = this.dataModel.indexedMetaData;
    var nested = this.dataModel.nest();
    var self = this;

    this.visualization = new Visualizations.LineChart(container, nested, {
      colors: this.getColorScheme(props),
      colorProperty: 'size',
      width: props.width,
      height: props.height,
      'background-color': props.background,
      numericFormat: this.getFormatter(indexedFields.size)
    });
    this.visualization.render();
    this.visualization.addEventListener('filter', function (filters) {
      filters = self.constructFilters(filters, context);
      xdo.api.handleClickEvent(filters);
      this.updateFilterInfo(filters.filter);
      console.log(filters);
    }).addEventListener('remove-filter', function (filters) {
      self.avoidRefresh = true;
      filters.forEach(function (filter) {
        try{
             xdo.app.viewer.GlobalFilter.removeFilter(context.id, filter.id);
        } catch (e) {}
      });
    });

  },
  refresh: function (context, container, data, fields, props) {
    //hack to avoid refresh when removing filters from this plugin
    if (!this.avoidRefresh) {
      var self = this;
      var parent = this.visualization.container.select('.line-chart');
      this.dataModel.setData(data).indexColumns();
      this.visualization.setColors(this.getColorScheme(props))
          .setData(this.dataModel.nest());
      this.visualization.removeChildren(parent.node()).done(function () {
        self.visualization.render(null, parent);
      });
    }
    this.avoidRefresh = false;
  },
  getFormatter: function (field, props) {
    if (xdo.api.format && field.dataType === 'number')
      return xdo.api.format(field.dataType, field.formatMask);

    return Utils.format('thousands');
  },
  constructFilters: function (data, context) {
    var group = this.dataModel.indexedMetaData.group.field;
    var filters = [];
    var children;
    for (var key in data) {
      filters.push({field: group, value: data[key].name});
    }

    return {
      id: context.id,
      filter: filters
    };
  }

}
