# Lystech Datagrid

import DataGrid from 'lystech-datagrid'

## Implementation

```
<Datagrid 

// Type string
title="some title"

// Type any
dataSource={yourDatasource}

primaryKeyName={id}

itemsPerPage={5}

getRowClass={(row) => {
    // allows to return specific class based on row data
}}

columns={{
    // show all ?
    all: true

    // allow searching on all columns
    allowAllSearch: true

    // allow sorting on all columns
    allowAllSorting: true

    // allow selection of row or not
    allowSelection={true}

    // those are examples of properties you could have in your datasource 
    // and 
    // display as columns
    email:{
        // name of the column
        label: "Email" ,
        // override allowAllSorting and allowAllSearch
        allowSorting: false,

        getValueFunction: (row) => {
            return row.email + " (Example email)"
        }
    }
    someOtherProperty:{
        label: "Hello World",
    }

    globalCommandButtons={{
        exportToCsv:{
            // Label in the button
            buttonText: "Export as CSV",
            // The type for "value" to use in your logic. 
            returnType: "selected",
            // onClick, what to do with selected
            onClick: (value) => // Some function to export as CSV
        }
    }}

    hideColumns={
        {
        //override what columns to hide / not show
        // example
        username:true,
        address:true
        }
    }
    }
}
></Datagrid>

```