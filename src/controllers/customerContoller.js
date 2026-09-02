const customerService = require('../services/customerService.js');

const createCustomer = async(req, res) => {
    const { name, cpf} = req.body;
    try{
        const customer = await customerService.createCustomer({ name, cpf });
        return res.status(201).json(customer);
    } catch(error) {
        console.log('🔴 Erro detalhado no Controller:', error);
        return res.status(400).json({ error: error.message });
    }
}

const getCustomers = async (req, res) => {
    try
    {
        const customers = await customerService.getCustomers();
        return res.status(200).json(customers);
    } catch(error) {
        return res.status(500).json({ error: error.message });
    }
}

const updateCustomer = async (req, res) => {
    const { name, cpf} = req.body;

    try{
        const updatedCustomer = await customerService.updateCustomer(req.params.id, { name, cpf });
        return res.status(200).json(updatedCustomer);
    } catch(error) {
        return res.status(404).json({ error: error.message });
    }
}

const deleteCustomer = async (req, res) => 
{
    try
    {
        const deletedCustomer = await customerService.deleteCustomer(req.params.id);
        return res.status(204).send();
    } catch(error){
        return res.status(404).json({ error: error.message });
    }
}

module.exports = {
    createCustomer,
    getCustomers,
    updateCustomer,
    deleteCustomer
}