import React, { useMemo } from 'react';
import type { ColDef } from 'ag-grid-community';
import { Form, Input, message } from 'antd';
import { empresasService } from '../services/empresasService';
import type { Empresa, EmpresaInsert, EmpresaUpdate } from '../types/database';
import BaseGridPage from '../components/BaseGridPage';
import { normalizeText } from '../utils/textUtils';
import { isValidRif, RIF_VALIDATION_ERROR_MSG, getRifRule } from '../utils/validators';

const EmpresasPage: React.FC = () => {
    const columnDefs = useMemo<ColDef<Empresa>[]>(() => [
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
            field: 'rif',
            headerName: 'RIF',
            minWidth: 150,
            flex: 1,
            filter: true,
            sortable: true,
            editable: true,
            cellClass: 'uppercase-input',
            valueParser: (params) => {
                const newValue = normalizeText(params.newValue);
                if (!isValidRif(newValue)) {
                    message.error({
                        content: RIF_VALIDATION_ERROR_MSG,
                        key: 'rif-validation-error'
                    });
                    return params.oldValue;
                }
                return newValue;
            }
        },
        {
            field: 'razon_social',
            headerName: 'Razón Social',
            minWidth: 250,
            flex: 2,
            filter: true,
            sortable: true,
            editable: true,
            cellClass: 'uppercase-input',
            valueParser: (params) => normalizeText(params.newValue)
        },
        {
            field: 'created_at',
            headerName: 'Fecha de Creación',
            width: 150,
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
                    getRifRule()
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
        <BaseGridPage<Empresa, EmpresaInsert, EmpresaUpdate>
            title="Empresas"
            entityName="Empresa"
            columnDefs={columnDefs}
            fetchFn={empresasService.getEmpresas}
            createFn={empresasService.createEmpresa}
            updateFn={empresasService.updateEmpresa}
            deleteFn={empresasService.deleteEmpresas}
            formItems={formItems}
            permissions={{ create: true, update: true, delete: true }}
        />
    );
};

export default EmpresasPage;
