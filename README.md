# Lystech Datagrid

import DataGrid from 'lystech-datagrid'

## Implementation

```
<Datagrid 

// Accepted props

  title: string,
  subTitle?: string,
  showTitle?: boolean,

  // Allows to see how many time the datagrid has been rendered for testing purposes
  showUpdateCount?: boolean,
  itemsPerPage?: number,
  dataSource: any[],
  primaryKey: string,

  // container
  containerClass: any,

  // Columns
  otherColumns: any,
  columns: any,
  columnsOptions?: {
    all: boolean,
    allowAllSearch: boolean,
    allowAllSorting: boolean,
    hideColumnHeaders: boolean,
  },
  hideColumns?: any[],

  // rows
  isItemSelected: any,
  onRowSelection: any,
  getRowClass: any,
  getSubContentFunction: any,
  
  // footer
  getGridFooterContent: any,

  // command buttons
  commandButtons?: commandButton[],
  globalCommandButtons?: globalCommandButton[],
  
  singleRowSelection?: boolean,
  allowSelection?: boolean,
  showCheckBoxes?: boolean,
  index: number,

  // self explanatory
  collapsed?: boolean,
  canCollapse?: boolean,

  // completely ignore those fields
  ignoreFields?: any[],

  // can set dynamically if is loading
  isLoading?: boolean,

></Datagrid>

```