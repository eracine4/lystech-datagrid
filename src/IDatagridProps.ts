interface commandButton {
  name: string
  functionName: any
}

export default interface IDatagridProps {
  title: string
  subTitle?: string
  showTitle?: boolean

  // Allows to see how many time the datagrid has been rendered for testing purposes
  showUpdateCount?: boolean
  itemsPerPage?: number
  dataSource: any[] | undefined
  primaryKey: string

  // container
  containerClass?: any

  // Columns
  otherColumns?: any
  columns: any
  columnsOptions?: {
    all: boolean
    allowAllSearch: boolean
    allowAllSorting: boolean
    hideColumnHeaders: boolean
  }
  hideColumns?: any

  // rows
  isItemSelected?: any
  isItemInEditMode?: any
  onRowCellClick?: any
  onRowCellDoubleClick?: any
  onRowCellTripleClick?: any
  onRowSelection?: any
  getRowClass?: any
  getSubContentFunction?: (currentRow: any, selectedRow: any) => any

  // footer
  getGridFooterContent?: (datas: { allDatas: any; currentDatas: any }) => any

  // command buttons
  commandButtons?: commandButton[]
  globalCommandButtons?: any[] | any

  singleRowSelection?: boolean
  allowSelection?: boolean
  showCheckBoxes?: boolean
  allowEdition?: boolean
  onRowEdition?: any

  index: number

  // self explanatory
  collapsed?: boolean
  canCollapse?: boolean

  // completely ignore those fields
  ignoreFields?: any[]

  // can set dynamically if is loading
  isLoading?: boolean
}
