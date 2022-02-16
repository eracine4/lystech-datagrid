import * as React from 'react'
import Datagrid from './DataGrid/DataGrid'
import IDatagridProps from './DataGrid/IDatagridProps'

const Package = (props: IDatagridProps) => {
  return <Datagrid {...props}></Datagrid>
}

export default Package
