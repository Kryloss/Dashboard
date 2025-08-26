'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SchemaCheckResult {
    tableExists: boolean
    columns: string[]
    constraints: string[]
    policies: string[]
    error?: string
}

export function DatabaseSchemaCheck() {
    const [schemaCheck, setSchemaCheck] = useState<SchemaCheckResult>({
        tableExists: false,
        columns: [],
        constraints: [],
        policies: []
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function checkSchema() {
            try {
                const supabase = createClient()
                
                // Check if profiles table exists and get its structure
                const { error: tableError } = await supabase
                    .from('profiles')
                    .select('*')
                    .limit(0)

                if (tableError) {
                    setSchemaCheck({
                        tableExists: false,
                        columns: [],
                        constraints: [],
                        policies: [],
                        error: tableError.message
                    })
                    setIsLoading(false)
                    return
                }

                // Try to get column information (this might not work with RLS)
                try {
                    const { data: columns, error: colError } = await supabase
                        .rpc('get_table_columns', { table_name: 'profiles' })
                    
                    if (!colError && columns) {
                        setSchemaCheck({
                            tableExists: true,
                            columns: columns.map((col: { column_name: string; data_type: string }) => `${col.column_name} (${col.data_type})`),
                            constraints: [],
                            policies: []
                        })
                    } else {
                        // Fallback: just confirm table exists
                        setSchemaCheck({
                            tableExists: true,
                            columns: ['Table exists but column details not accessible'],
                            constraints: [],
                            policies: []
                        })
                    }
                } catch {
                    setSchemaCheck({
                        tableExists: true,
                        columns: ['Table exists but column details not accessible'],
                        constraints: [],
                        policies: []
                    })
                }

                setIsLoading(false)
            } catch (error) {
                setSchemaCheck({
                    tableExists: false,
                    columns: [],
                    constraints: [],
                    policies: [],
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
                setIsLoading(false)
            }
        }

        checkSchema()
    }, [])

    if (isLoading) {
        return (
            <Card className="bg-[#121922] border-[#2A3442] shadow-[0_14px_40px_rgba(0,0,0,0.55)] rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-[#FBF7FA]">Database Schema Check</CardTitle>
                    <CardDescription className="text-[#9CA9B7]">Checking database structure...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse">
                        <div className="h-4 bg-[#2A3442] rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-[#2A3442] rounded w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-[#121922] border-[#2A3442] shadow-[0_14px_40px_rgba(0,0,0,0.55)] rounded-2xl">
            <CardHeader>
                <CardTitle className="text-[#FBF7FA]">Database Schema Check</CardTitle>
                <CardDescription className="text-[#9CA9B7]">Profiles table structure and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {schemaCheck.error ? (
                    <div className="text-red-400 text-sm">
                        <strong>Error:</strong> {schemaCheck.error}
                    </div>
                ) : (
                    <>
                        <div>
                            <h4 className="text-[#FBF7FA] font-medium mb-2">Table Status</h4>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                schemaCheck.tableExists 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-red-500/20 text-red-400'
                            }`}>
                                {schemaCheck.tableExists ? '✅ Exists' : '❌ Missing'}
                            </div>
                        </div>

                        {schemaCheck.tableExists && (
                            <>
                                <div>
                                    <h4 className="text-[#FBF7FA] font-medium mb-2">Columns</h4>
                                    <div className="space-y-1">
                                        {schemaCheck.columns.map((column, index) => (
                                            <div key={index} className="text-[#9CA9B7] text-sm font-mono bg-[#1C2430] px-2 py-1 rounded">
                                                {column}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-[#9CA9B7] text-sm">
                                    <strong>Note:</strong> If you&apos;re seeing OAuth errors, check that your profiles table has:
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>Required fields: id, email, username, full_name</li>
                                        <li>Proper RLS policies for authenticated users</li>
                                        <li>Correct data types (id should be UUID, email should be text)</li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
