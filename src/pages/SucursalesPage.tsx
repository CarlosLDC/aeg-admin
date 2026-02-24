import React, { useMemo, useEffect, useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import { Form, Input, Select, Switch, Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { sucursalesService } from '../services/sucursalesService';
import { empresasService } from '../services/empresasService';
import type { Sucursal, SucursalInsert, SucursalUpdate, Empresa } from '../types/database';
import BaseGridPage from '../components/BaseGridPage';
import { normalizeText } from '../utils/textUtils';
import { usePermissions } from '../hooks/usePermissions';

const SucursalesPage: React.FC = () => {
    const permissions = usePermissions();
    const [empresas, setEmpresas] = useState<Empresa[]>([]);

    useEffect(() => {
        empresasService.getEmpresas().then(setEmpresas).catch(console.error);
    }, []);

    const empresaMap = useMemo(() => {
        const map: Record<number, string> = {};
        empresas.forEach(emp => {
            map[emp.id] = emp.razon_social;
        });
        return map;
    }, [empresas]);

    const columnDefs = useMemo<ColDef<Sucursal>[]>(() => [
        {
            field: 'id',
            headerName: 'ID',
            width: 80,
            sortable: true,
            checkboxSelection: true,
            headerCheckboxSelection: true,
            pinned: 'left'
        },
        {
            field: 'id_empresa',
            headerName: 'Empresa',
            minWidth: 200,
            flex: 1,
            filter: 'agTextColumnFilter',
            filterValueGetter: (params) => {
                if (!params.data) return '';
                return empresaMap[params.data.id_empresa] || params.data.id_empresa;
            },
            valueFormatter: (params) => empresaMap[params.value] || params.value
        },
        {
            field: 'ciudad',
            headerName: 'Ciudad',
            minWidth: 150,
            filter: true,
            editable: true,
            cellClass: 'uppercase-input',
            valueParser: (params) => normalizeText(params.newValue)
        },
        {
            field: 'estado',
            headerName: 'Estado',
            minWidth: 150,
            filter: true,
            editable: true,
            cellClass: 'uppercase-input',
            valueParser: (params) => normalizeText(params.newValue)
        },
        {
            field: 'direccion',
            headerName: 'Dirección',
            minWidth: 250,
            flex: 1,
            filter: true,
            editable: true,
            cellClass: 'uppercase-input',
            valueParser: (params) => normalizeText(params.newValue)
        },
        {
            field: 'es_cliente',
            headerName: 'Cliente',
            width: 100,
            editable: true,
            cellRenderer: (params: any) => (
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: `1px solid ${params.value ? '#2196F3' : '#d9d9d9'}`,
                        borderRadius: '2px',
                        backgroundColor: params.value ? '#2196F3' : 'transparent',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        transition: 'all 0.2s'
                    }}>
                        {params.value && <CheckOutlined style={{ fontSize: '10px' }} />}
                    </div>
                </div>
            ),
            cellEditor: 'agCheckboxCellEditor',
        },
        {
            field: 'es_distribuidora',
            headerName: 'Distribuidora',
            width: 130,
            editable: true,
            cellRenderer: (params: any) => (
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: `1px solid ${params.value ? '#2196F3' : '#d9d9d9'}`,
                        borderRadius: '2px',
                        backgroundColor: params.value ? '#2196F3' : 'transparent',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        transition: 'all 0.2s'
                    }}>
                        {params.value && <CheckOutlined style={{ fontSize: '10px' }} />}
                    </div>
                </div>
            ),
            cellEditor: 'agCheckboxCellEditor',
        },
        {
            field: 'es_centro_servicio',
            headerName: 'C. Servicio',
            width: 130,
            editable: true,
            cellRenderer: (params: any) => (
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: `1px solid ${params.value ? '#2196F3' : '#d9d9d9'}`,
                        borderRadius: '2px',
                        backgroundColor: params.value ? '#2196F3' : 'transparent',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        transition: 'all 0.2s'
                    }}>
                        {params.value && <CheckOutlined style={{ fontSize: '10px' }} />}
                    </div>
                </div>
            ),
            cellEditor: 'agCheckboxCellEditor',
        },
        {
            field: 'created_at',
            headerName: 'Fecha',
            width: 120,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
        },
    ], [empresaMap]);

    const formItems = (
        <>
            <Form.Item
                name="id_empresa"
                label="Empresa"
                rules={[{ required: true, message: 'Seleccione la empresa' }]}
            >
                <Select
                    placeholder="Seleccione una empresa"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={empresas.map(emp => ({
                        value: emp.id,
                        label: `${emp.razon_social} (${emp.rif})`
                    }))}
                />
            </Form.Item>

            <Space style={{ display: 'flex' }} align="baseline">
                <Form.Item
                    name="ciudad"
                    label="Ciudad"
                    rules={[{ required: true, message: 'Ingrese la ciudad' }]}
                    normalize={normalizeText}
                >
                    <Input placeholder="Ej: Caracas" />
                </Form.Item>
                <Form.Item
                    name="estado"
                    label="Estado"
                    rules={[{ required: true, message: 'Ingrese el estado' }]}
                    normalize={normalizeText}
                >
                    <Input placeholder="Ej: Distrito Capital" />
                </Form.Item>
            </Space>

            <Form.Item
                name="direccion"
                label="Dirección"
                rules={[{ required: true, message: 'Ingrese la dirección' }]}
                normalize={normalizeText}
            >
                <Input.TextArea placeholder="Dirección completa" rows={2} />
            </Form.Item>

            <Space style={{ display: 'flex' }} align="baseline">
                <Form.Item name="telefono" label="Teléfono">
                    <Input placeholder="Opcional" />
                </Form.Item>
                <Form.Item name="correo" label="Correo">
                    <Input placeholder="Opcional" />
                </Form.Item>
            </Space>

            <Space size="large" style={{ marginTop: 8 }}>
                <Form.Item name="es_cliente" label="Cliente" valuePropName="checked" initialValue={false}>
                    <Switch size="small" />
                </Form.Item>
                <Form.Item name="es_distribuidora" label="Distribuidora" valuePropName="checked" initialValue={false}>
                    <Switch size="small" />
                </Form.Item>
                <Form.Item name="es_centro_servicio" label="C. Servicio" valuePropName="checked" initialValue={false}>
                    <Switch size="small" />
                </Form.Item>
            </Space>
        </>
    );

    return (
        <BaseGridPage<Sucursal, SucursalInsert, SucursalUpdate>
            title="Sucursales"
            entityName="Sucursal"
            columnDefs={columnDefs}
            fetchFn={sucursalesService.getSucursales}
            createFn={sucursalesService.createSucursal}
            updateFn={sucursalesService.updateSucursal}
            deleteFn={sucursalesService.deleteSucursales}
            formItems={formItems}
            permissions={permissions}
        />
    );
};

export default SucursalesPage;
