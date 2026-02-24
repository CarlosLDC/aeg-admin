import React, { useMemo } from 'react';
import type { ColDef } from 'ag-grid-community';
import { Form, Input, InputNumber, DatePicker } from 'antd';
import { modelosService } from '../services/modelosService';
import type { ModeloImpresora, ModeloImpresoraInsert, ModeloImpresoraUpdate } from '../types/database';
import BaseGridPage from '../components/BaseGridPage';
import { normalizeText } from '../utils/textUtils';
const ModelosPage: React.FC = () => {
    const columnDefs = useMemo<ColDef<ModeloImpresora>[]>(() => [
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
            field: 'marca',
            headerName: 'Marca',
            minWidth: 150,
            flex: 1,
            filter: true,
            sortable: true,
            editable: true,
            cellClass: 'uppercase-input',
            valueParser: (params) => normalizeText(params.newValue)
        },
        {
            field: 'codigo_modelo',
            headerName: 'Código Modelo',
            minWidth: 150,
            flex: 1,
            filter: true,
            sortable: true,
            editable: true,
            cellClass: 'uppercase-input',
            valueParser: (params) => normalizeText(params.newValue)
        },
        {
            field: 'precio',
            headerName: 'Precio',
            width: 130,
            sortable: true,
            editable: true,
            valueFormatter: (params) => {
                return params.value ? new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(params.value) : '';
            }
        },
        {
            field: 'providencia',
            headerName: 'Providencia',
            minWidth: 200,
            flex: 1.5,
            filter: true,
            sortable: true,
            editable: true,
            cellClass: 'uppercase-input',
            valueParser: (params) => normalizeText(params.newValue)
        },
        {
            field: 'fecha_homologacion',
            headerName: 'Fecha Homologación',
            width: 180,
            sortable: true,
            editable: true,
            cellEditor: 'agDateCellEditor',
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
        },
        {
            field: 'created_at',
            headerName: 'Creado el',
            width: 150,
            sortable: true,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
        },
    ], []);

    const formItems = (
        <>
            <Form.Item
                name="marca"
                label="Marca"
                rules={[{ required: true, message: 'La marca es obligatoria' }]}
                normalize={normalizeText}
            >
                <Input placeholder="Ej: BEMATECH" className="uppercase-input" />
            </Form.Item>

            <Form.Item
                name="codigo_modelo"
                label="Código Modelo"
                rules={[{ required: true, message: 'El código del modelo es obligatorio' }]}
                normalize={normalizeText}
            >
                <Input placeholder="Ej: MP-4000" className="uppercase-input" />
            </Form.Item>

            <Form.Item
                name="precio"
                label="Precio (USD)"
                rules={[
                    { required: true, message: 'El precio es obligatorio' },
                    { type: 'number', min: 0.01, message: 'El precio debe ser mayor a 0' }
                ]}
            >
                <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                    placeholder="0.00"
                />
            </Form.Item>

            <Form.Item
                name="providencia"
                label="Providencia"
                rules={[{ required: true, message: 'La providencia es obligatoria' }]}
                normalize={normalizeText}
            >
                <Input placeholder="Ej: SENIAT/0001" className="uppercase-input" />
            </Form.Item>

            <Form.Item
                name="fecha_homologacion"
                label="Fecha de Homologación"
                rules={[{ required: true, message: 'La fecha de homologación es obligatoria' }]}
            >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
        </>
    );

    return (
        <BaseGridPage<ModeloImpresora, ModeloImpresoraInsert, ModeloImpresoraUpdate>
            title="Modelos"
            entityName="Modelo de Impresora"
            columnDefs={columnDefs}
            fetchFn={modelosService.getModelos}
            createFn={modelosService.createModelo}
            updateFn={modelosService.updateModelo}
            deleteFn={modelosService.deleteModelos}
            formItems={formItems}
            permissions={{ create: true, update: true, delete: true }}
        />
    );
};

export default ModelosPage;
