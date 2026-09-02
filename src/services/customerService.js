export const createCustomer = async (customerData) => {
    const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select();

    if (error) {
        throw new Error(`An error occurred while creating the customers: ${error.message}`);
    }

    return data;
}

export const getUsers = async () => {
    const { data, error } = await supabase
        .from('customers')
        .select('*');

    if (error) {
        throw new Error(`An error occurred while fetching customers: ${error.message}`);
    }

    return data;
}

export const updateCustomer = async (customerId, updatedData) => {
    const { data, error } = await supabase
    .from('customers')
    .update(updatedData)
    .eq('id', customerId)
    .select();

    if (error) {
        throw new Error(`An error occurred while updating the customer: ${error.message}`);
    }

    return data;
}

export const deleteCustomer = async (customerId) => {
    const { data, error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)
    .select();

    if (error) {
        throw new Error(`An error occurred while deleting the customer: ${error.message}`);
    }

    return { success: true, message: 'Customer deleted successfully' };
}
