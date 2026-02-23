import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useTheme } from '../contexts/ThemeContext';
import { themeQuartz } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { Typography, Card, Button, Modal, Form, message, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface BaseGridPageProps<T> {
    title: string;
    entityName: string; // Used for messages (e.g., 'Empresa', 'Máquina')
    columnDefs: ColDef<T>[];
    fetchFn: () => Promise<T[]>;
    createFn: (values: any) => Promise<any>;
    updateFn?: (id: number | string, values: any) => Promise<any>;
    deleteFn?: (ids: (number | string)[]) => Promise<any>;
    formItems?: React.ReactNode;
    idField?: keyof T;
    permissions?: {
        create?: boolean;
        update?: boolean;
        delete?: boolean;
    };
}

const BaseGridPage = <T extends { [key: string]: any }>({
    title,
    entityName,
    columnDefs,
    fetchFn,
    createFn,
    updateFn,
    deleteFn,
    formItems,
    idField = 'id' as keyof T,
    permissions = { create: true, update: true, delete: true }
}: BaseGridPageProps<T>) => {
    const { isDark } = useTheme();

    const myTheme = useMemo(() => isDark
        ? themeQuartz.withParams({
            backgroundColor: '#1f1f1f',
            browserColorScheme: 'dark',
            chromeBackgroundColor: { ref: 'foregroundColor', mix: 0.07, onto: 'backgroundColor' },
            foregroundColor: '#FFFFFF',
        })
        : themeQuartz.withParams({
            browserColorScheme: 'light',
        })
        , [isDark]);

    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
    const [gridApi, setGridApi] = useState<any>(null);

    const getFriendlyErrorMessage = (error: any, action: string) => {
        const code = error?.code || error?.status;

        if (code === '23503') {
            return `No se puede eliminar ${entityName.toLowerCase()}${selectedIds.length > 1 ? 's' : ''} porque tiene datos asociados (ej: máquinas o registros vinculados).`;
        }
        if (code === '23505') {
            return `Ya existe ${entityName.toLowerCase()} con esos datos únicos (ej: RIF duplicado).`;
        }

        return error.message || `Error al ${action} ${entityName.toLowerCase()}${action === 'eliminar' ? 's' : ''}`;
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await fetchFn();
            setData(result);
        } catch (error: any) {
            message.error(error.message || `Error al cargar ${entityName.toLowerCase()}s`);
        } finally {
            setLoading(false);
        }
    }, [fetchFn, entityName]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (!window.confirm(`¿Está seguro de que desea eliminar las ${selectedIds.length} ${entityName.toLowerCase()}s seleccionadas? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            setLoading(true);
            if (deleteFn) {
                await deleteFn(selectedIds);
            }
            message.success(`${selectedIds.length} ${entityName.toLowerCase()}s eliminadas exitosamente`);
            setData(prev => prev.filter(item => !selectedIds.includes(item[idField])));
            setSelectedIds([]);
        } catch (error: any) {
            message.error(getFriendlyErrorMessage(error, 'eliminar'));
        } finally {
            setLoading(false);
        }
    };

    const handleExportCsv = () => {
        if (gridApi) {
            gridApi.exportDataAsCsv({
                fileName: `${entityName.toLowerCase()}s_${new Date().toISOString().split('T')[0]}.csv`
            });
        }
    };

    const handleCellValueChanged = async (event: any) => {
        const { data: rowData, colDef, newValue, oldValue } = event;
        if (newValue === oldValue) return;

        try {
            if (updateFn) {
                await updateFn(rowData[idField], { [colDef.field]: newValue });
            }
            message.success(`Campo "${colDef.headerName}" actualizado exitosamente`);
        } catch (error: any) {
            message.error(getFriendlyErrorMessage(error, 'actualizar'));
            fetchData();
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (createFn) {
                await createFn(values);
            }
            message.success(`${entityName} creada exitosamente`);

            setIsModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (error: any) {
            if (error.errorFields) return;
            message.error(getFriendlyErrorMessage(error, 'guardar'));
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const defaultColDef = useMemo<ColDef>(() => ({
        resizable: true,
    }), []);

    return (
        <div className="fade-in">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <Title level={2} style={{ margin: 0, minWidth: '200px' }}>
                    {title}
                </Title>
                <Space wrap>
                    <Button type="default" icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
                        Refrescar
                    </Button>
                    <Button type="default" icon={<DownloadOutlined />} onClick={handleExportCsv}>
                        Exportar CSV
                    </Button>
                    {selectedIds.length > 0 && permissions.delete && deleteFn && (
                        <Button
                            danger
                            type="primary"
                            icon={<DeleteOutlined />}
                            onClick={handleBulkDelete}
                            loading={loading}
                        >
                            Eliminar Seleccionados ({selectedIds.length})
                        </Button>
                    )}
                    {permissions.create && Boolean(createFn) && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                            Nueva {entityName}
                        </Button>
                    )}
                </Space>
            </div>

            <Card bordered={false} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ height: 'calc(100vh - 250px)', width: '100%' }}>
                    <AgGridReact
                        key={isDark ? 'dark' : 'light'}
                        theme={myTheme}
                        rowData={data}
                        columnDefs={columnDefs.map(col => ({
                            ...col,
                            editable: permissions.update ? col.editable : false
                        }))}
                        defaultColDef={defaultColDef}
                        animateRows={true}
                        pagination={true}
                        paginationPageSize={15}
                        rowHeight={50}
                        rowSelection="multiple"
                        onCellValueChanged={handleCellValueChanged}
                        onGridReady={(params) => setGridApi(params.api)}
                        onSelectionChanged={() => {
                            if (gridApi) {
                                const selectedNodes = gridApi.getSelectedNodes();
                                const selectedData = selectedNodes.map((node: any) => node.data[idField]);
                                setSelectedIds(selectedData);
                            }
                        }}
                    />
                </div>
            </Card>

            <Modal
                title={`Nueva ${entityName}`}
                open={isModalVisible}
                onOk={handleSubmit}
                onCancel={handleCancel}
                confirmLoading={loading}
                okText="Guardar"
                cancelText="Cancelar"
            >
                <Form form={form} layout="vertical" preserve={false} style={{ marginTop: '24px' }}>
                    {formItems}
                </Form>
            </Modal>
        </div>
    );
};

export default BaseGridPage;
