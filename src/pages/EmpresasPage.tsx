import React, { useMemo } from 'react';
import type { ColDef } from 'ag-grid-community';
import { Form, Input, message } from 'antd';
import { empresasService } from '../services/empresasService';
import type { Empresa } from '../types/database';
import BaseGridPage from '../components/BaseGridPage';
import { normalizeText } from '../utils/textUtils';

const EmpresasPage: React.FC = () => {
    const columnDefs = useMemo<ColDef<Empresa>[]>(() => [
        {
            field: 'id',
            headerName: 'ID',
            width: 100,
            sortable: true,
            checkboxSelection: true,
            headerCheckboxSelection: true,
        },
        {
            field: 'rif',
            headerName: 'RIF',
            flex: 1,
            filter: true,
            sortable: true,
            editable: true,
            valueParser: (params) => {
                const newValue = normalizeText(params.newValue);
                const rifRegex = /^[VEJPG][0-9]{7,9}$/;
                if (!rifRegex.test(newValue)) {
                    message.error('Formato de RIF inválido. Debe ser: V/E/J/P/G seguido de 7 a 9 números.');
                    return params.oldValue;
                }
                return newValue;
            }
        },
        {
            field: 'razon_social',
            headerName: 'Razón Social',
            flex: 2,
            filter: true,
            sortable: true,
            editable: true,
            valueParser: (params) => normalizeText(params.newValue)
        },
        {
            field: 'created_at',
            headerName: 'Fecha de Creación',
            flex: 1,
            sortable: true,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
        },
    ], []);

    const formItems = (
        <>
            <Form.Item
                name="rif"
                label="RIF"
                rules={[
                    { required: true, message: 'Por favor ingrese el RIF' },
                    { pattern: /^[VEJPG][0-9]{7,9}$/i, message: 'Formato inválido. Ejemplo: J123456789' }
                ]}
                normalize={normalizeText}
            >
                <Input placeholder="Ej: J12345678" />
            </Form.Item>

            <Form.Item
                name="razon_social"
                label="Razón Social"
                rules={[{ required: true, message: 'Por favor ingrese la razón social' }]}
                normalize={normalizeText}
            >
                <Input placeholder="Ej: Empresa Ejemplo, C.A." />
            </Form.Item>
        </>
    );

    return (
        <BaseGridPage<Empresa>
            title="Empresas"
            entityName="Empresa"
            columnDefs={columnDefs}
            fetchFn={empresasService.getEmpresas}
            createFn={empresasService.createEmpresa}
            updateFn={empresasService.updateEmpresa as any}
            deleteFn={empresasService.deleteEmpresas as any}
            formItems={formItems}
            permissions={{ create: true, update: true, delete: true }}
        />
    );
};

export default EmpresasPage;
